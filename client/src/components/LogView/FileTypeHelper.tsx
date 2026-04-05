export interface RetrievedFileInfo {
  _id: string;
  ts: Date;
  participantUID: string;
  fileType: {
    _id: string;
    name: string;
    experimentId: string;
    extension: string;
    description: string
  };
  mimetype: string;
  size: number;
  // Added authorship tracking fields
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedAt?: Date;
  version?: number;
  isActive?: boolean;
}

// Convert ISO Date String to short date
export const convertDate = (dateString) => {
  // Create a Date object
  const date = new Date(dateString);

  // Extract month, day, and year
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = String(date.getUTCFullYear());

  // Format as MM/DD/YYYY
  if (month == "NaN" || day == "NaN" || year == "NaN") {
    return "Never"
  } else {
    const shortDate = `${month}/${day}/${year}`;
    return shortDate
  }

  /* 
      Explanation:
      1. new Date(dateString) creates a Date object from the ISO date string.
      2. getUTCMonth() returns the month (0-indexed, so we add 1).
      3. getUTCDate() returns the day of the month.
      4. getUTCFullYear() returns the year.
      5. padStart(2, '0') ensures that single-digit months and days are padded with a leading zero.
      6. The final formatted string is constructed using template literals.
  */

}