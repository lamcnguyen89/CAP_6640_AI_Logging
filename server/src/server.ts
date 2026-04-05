import mongoose from "mongoose";
import passport from "passport";
// eslint-disable-next-line no-unused-vars
import express, { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";

import expressWs from "express-ws";
// routes
import emailRoutes from "./routes/api/emailroute";
import users from "./routes/api/users";
import surveys from "./routes/api/survey";
import participants from "./routes/api/participants";
import study from "./routes/api/study";
import path from "path";
import experiments from "./routes/api/experiments";
import sites from "./routes/api/sites";
import dropboxRouter from "./routes/api/dropbox";
import researcherNotes from "./routes/api/researcherNotes";
import columnDefinitions from "./routes/api/columndefinitions";
import institutions from "./routes/api/institutions";
import { logger } from "./utils/logger";
var jwt = require("jsonwebtoken");

// **** DB CONFIG ****

import configPassport from "./config/passport";
import keys from "./config/keys";
import User from "./models/User";
const LOCAL = true;
const db = LOCAL ? keys.localMongoURI : keys.localMongoURI;

// mongoose.set('useFindAndModify', false')
const app: Express = express();
expressWs(app); // Integrate express-ws. This integrates Websocket functionality into express. Websockets provide real-time communication between the server and clients.

// Configure Morgan HTTP request logging
// Morgan is a library for logging HTTP requests with Winston for express and Node applications
const morganFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Create Morgan stream that writes to Winston logger
const morganStream = {
  write: (message: string) => {
    // Remove the trailing newline that Morgan adds
    logger.info(message.trim());
  },
};

// Add Morgan middleware - skip logging during tests
if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "testing") {
  app.use(morgan(morganFormat, { stream: morganStream }));
}

app.use(bodyParser.json({ limit: "100mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "100mb",
    parameterLimit: 50000,
  })
);
app.use(express.json());

// Serve static files in the /static directory
// app.use('/static', express.static(path.join(__dirname, '../static')))
app.use((req, res, next) => {
  next();
});

app.get("/", function (req, res, next) {
  logger.debug("get route", req);
  res.end();
});

// When a client connects to /api/ws, the server:
// 1. Generates a unique connection ID using timestamp and random string
// 2. Registers the connection with the Websocket service for management
// 3. Sets up event handlers for incoming messages and errors

app.ws(`/api/ws`, function (ws, req) {
  logger.debug("Websocket connection");
  logger.debug(ws.protocol);

  // Generate a unique connection ID
  const connectionId = `conn_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Register connection (importing at runtime to avoid circular dependencies)
  const websocketService = require("./services/websocketService").default;
  websocketService.registerConnection(ws, connectionId);

  ws.on("message", function (msg) {
    // Handle different real-time message types
    /* 
    
      1. Authentication (authenticate): Verifies JWT tokens using same secret key as server
      2. Ping/Pong (ping): heartbeat mechanism to keep websocket connection alive
      3. CSV Processing Subscription (subscribe_csv_processing): allows client to subscribe to real-time updates for specific CSV processing tasks
      4. CSV Processing Unsubscription (unsubscribe_csv_processing)
      5. Default message handling (default)
      6. Error handling for JSON parsing errors
    */

    try {
      // Parse the incoming message
      let parsed = JSON.parse(msg);

      // This section handles different types of messages
      if (parsed.type === "authenticate") {
        // Verify the JWT token sent by the client
        jwt.verify(
          parsed.payload.token,
          keys.secretOrKey,
          async function (err, decoded) {
            if (decoded == undefined || err !== null) {
              ws.send(
                JSON.stringify({
                  type: "authentication",
                  payload: false,
                  msg: err,
                })
              );
            } else {
              // Authenticate the connection in the WebSocket service
              const authenticated =
                await websocketService.authenticateConnection(
                  connectionId,
                  parsed.payload.token
                );

              if (authenticated) {
                ws.send(
                  JSON.stringify({ type: "authentication", payload: true })
                );
              } else {
                ws.send(
                  JSON.stringify({ type: "authentication", payload: false })
                );
                ws.close();
              }
            }
          }
        );
      } else if (parsed.type === "ping") {
        // Handle ping messages to keep the connection alive
        ws.send(JSON.stringify({ type: "pong" }));
      } else if (parsed.type === "subscribe_csv_processing") {
        // Subscribe to CSV processing updates for a specific participant and file type
        const { participantId, fileTypeId } = parsed.payload;
        if (participantId && fileTypeId) {
          websocketService.subscribeToFileTypeProcessing(
            connectionId,
            participantId,
            fileTypeId
          );
          ws.send(
            JSON.stringify({
              type: "csv_processing_subscription",
              payload: { subscribed: true, participantId, fileTypeId },
            })
          );
        }
      } else if (parsed.type === "unsubscribe_csv_processing") {
        // Unsubscribe from CSV processing updates
        websocketService.unsubscribeFromFileTypeProcessing(connectionId);
        ws.send(
          JSON.stringify({
            type: "csv_processing_subscription",
            payload: { subscribed: false },
          })
        );
      } else {
        // Default message handling for other types of messages
        ws.send(msg);
      }
    } catch (err) {
      console.error(err);
    }
  });
  ws.on("error", (err) => {
    // If error occurs, log it and show in console
    console.error("WebSocket error:", err);
    logger.error("WebSocket error", err);
  });
});

mongoose
  .connect(db, { authSource: process.env.MONGO_AUTH_DB })
  .then(() => logger.system("MongoDB Connected"))
  .catch((err: any) => logger.error("MongoDB connection failed", err));

// passport middleware
app.use(passport.initialize());
// passport config
configPassport(passport);

/** Will add ```.serverConfig``` to ```req``` object */
const addServerConfig = function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  // passing some db and mongoose information to these routes
  req.serverConfig = {
    db: db,
    mongoose: mongoose,
  };
  next();
};

// API route modules.
app.use(`/api/users`, addServerConfig, users);
app.use(`/api/institutions`, addServerConfig, institutions);
app.use(`/api/participants`, addServerConfig, participants);
app.use(`/api/surveys`, addServerConfig, surveys);
app.use(`/api/studies`, addServerConfig, study);
app.use(`/api/experiments`, addServerConfig, experiments);
app.use(`/api/sites`, addServerConfig, sites);
app.use(`/api/notes`, addServerConfig, researcherNotes);
app.use(`/api/columndefinitions`, addServerConfig, columnDefinitions);
app.use("/api/dropbox", dropboxRouter);

// API Routes
app.use(`/api/email`, emailRoutes);

app.use(`/api/`, study);

// This will catch any route not picked up by the above .get's, will also send users to react app.
// Will only work after running react build
app.get("*", cors(), (req, res) => {
  try {
    // The main react build file
    res.send("Out");
    // res.sendFile('client/public/index.html', { root: './' })
  } catch (err) {
    if (err !== undefined) {
      logger.error("Server error", err);
    }
  }
});

// local server will run on port 4000
const PORT = process.env.NODE_PORT !== undefined ? process.env.NODE_PORT : 4000;

app.listen(PORT, () => {
  logger.system(`Server is running on port ${PORT}`);
});
async function closeGracefully(signal) {
  logger.system(`Received signal to terminate: ${signal}`);

  process.exit();
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);

export default app;
