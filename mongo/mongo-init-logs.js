db = db.getSiblingDB('admin'); // switch to admin db to create the user

db.createUser({
  user: process.env.MONGO_LOGS_USER,
  pwd: process.env.MONGO_LOGS_PASS,
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_LOGS_DB
    }
  ]
});

// Switch to the vera_logs database
db = db.getSiblingDB(process.env.MONGO_LOGS_DB);

// Create the system_logs collection (this will be created automatically when first log is inserted)
// But we can create indexes proactively for better performance

// Creating indexes for better query performance
db.system_logs.createIndex({ "timestamp": 1 }); // Index on timestamp for time-based queries
db.system_logs.createIndex({ "level": 1 }); // Index on log level for filtering by severity
db.system_logs.createIndex({ "label": 1 }); // Index on environment label (dev/prod)
db.system_logs.createIndex({ "timestamp": 1, "level": 1 }); // Compound index for common queries

print("MongoDB logs database initialized successfully");
print("Created user: " + process.env.MONGO_LOGS_USER);
print("Created indexes on system_logs collection");