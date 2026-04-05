// csvHelper.ts
import { Readable } from "stream";
import csv from "csv-parser";
import Log from "../models/Log";
import websocketService from "../services/websocketService";

/**
 * Processes CSV content, validates rows, and bulk‑upserts logs.
 * @param fileBuffer - Buffer containing CSV data.
 * @param participantId - The participant ID.
 * @param fileTypeId - The file type ID.
 * @param experimentId - The experiment ID.
 * @returns A promise that resolves when CSV processing is complete.
 */
export async function processCsvLogs(
  fileBuffer: Buffer,
  participantId: string,
  fileTypeId: string,
  experimentId: string
): Promise<void> {
  // Notify that processing has started through WebSocket.
  websocketService.notifyProcessingStarted(participantId, fileTypeId);

  return new Promise<void>((resolve, reject) => {
    let sessionStart: Date | null = null;
    let ops: any[] = [];
    const batchSize = 1000;
    let totalRowsProcessed = 0;
    let currentBatchNumber = 0;

    // Estimate total rows for progress tracking
    let estimatedTotalRows = 0;
    let currentRowCount = 0;

    // Queue for sequentially processing bulk writes.
    const queue: any[][] = [];
    let processing = false;

    // Process the queue sequentially.
    const processQueue = async () => {
      if (processing) return;
      processing = true;
      while (queue.length > 0) {
        const batch = queue.shift();
        currentBatchNumber++;
        try {
          console.log(
            `Processing batch ${currentBatchNumber} of ${batch?.length} operations...`
          );
          await Log.bulkWrite(batch);
          totalRowsProcessed += batch?.length || 0;

          // Send progress update
          websocketService.notifyProcessingProgress(
            participantId,
            fileTypeId,
            totalRowsProcessed,
            estimatedTotalRows || totalRowsProcessed,
            currentBatchNumber,
            Math.ceil((currentRowCount || totalRowsProcessed) / batchSize)
          );

          console.log(
            `Batch ${currentBatchNumber} processed successfully. Total processed: ${totalRowsProcessed}`
          );
        } catch (err) {
          console.error("Error saving batch logs:", err);
          processing = false;
          websocketService.notifyProcessingError(
            participantId,
            fileTypeId,
            `Error processing batch ${currentBatchNumber}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          return reject(err);
        }
      }
      processing = false;
    };

    // Create a readable stream from the file buffer.
    const stream = Readable.from(fileBuffer);

    stream
      .pipe(
        csv({
          mapValues: ({ value }) => value,
        })
      )
      .on("headers", (headers: string[]) => {
        console.log("CSV headers:", headers);
      })
      .on("data", (row: any) => {
        currentRowCount++;

        // Skip empty rows.
        if (
          Object.values(row).every(
            (val) => val === null || val === undefined || val === ""
          )
        ) {
          return;
        }
        // Use proper header names.
        const { ts, eventId, ...otherData } = row;
        if (!ts) {
          // If the key is missing, skip this row.
          console.warn("Row missing Timestamp, skipping:", row);
          return;
        }
        // Set session start from the first valid row.
        if (!sessionStart) {
          sessionStart = new Date(ts);
        }
        // Build the bulkWrite operation.
        ops.push({
          updateOne: {
            filter: {
              ts: new Date(ts),
              participant: participantId,
              fileType: fileTypeId,
              eventId: Number(eventId),
            },
            update: {
              $set: {
                ts: ts,
                experimentId: experimentId,
                participant: participantId,
                fileType: fileTypeId,
                eventId: eventId,
                data: otherData,
              },
            },
            upsert: true,
          },
        });

        // When batch size is reached, push the batch to the queue.
        if (ops.length >= batchSize) {
          console.log(`Queueing a batch of ${ops.length} operations...`);
          queue.push([...ops]); // Push a copy of the current batch.
          ops = []; // Reset the operations array.
          processQueue(); // Start processing the queue.
        }
      })
      .on("end", async () => {
        console.log("Finished parsing CSV stream.");
        // Update estimated total with actual count
        estimatedTotalRows = currentRowCount;

        // Process any remaining operations.
        if (ops.length > 0) {
          console.log(`Queueing final batch of ${ops.length} operations...`);
          queue.push([...ops]);
          ops = [];
        }
        // Ensure all queued batches are processed.
        try {
          await processQueue();

          // Send completion notification
          websocketService.notifyProcessingCompleted(
            participantId,
            fileTypeId,
            totalRowsProcessed
          );

          console.log(
            "CSV processing complete for participant:",
            participantId
          );
          resolve();
        } catch (err) {
          websocketService.notifyProcessingError(
            participantId,
            fileTypeId,
            `Error completing CSV processing: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          return reject(err);
        }
      })
      .on("error", (err) => {
        console.error("Error while parsing CSV:", err);
        websocketService.notifyProcessingError(
          participantId,
          fileTypeId,
          `CSV parsing error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        reject(err);
      });
  });
}
