import mongoose from "mongoose";

let connectionPromise = null;
let indexesSynced = false;

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  connectionPromise ??= mongoose.connect(mongoUri);
  await connectionPromise;

  if (indexesSynced) {
    return mongoose.connection;
  }

  try {
    await mongoose.connection.db
      .collection("diaryentries")
      .dropIndex("user_1_entryDate_1");
  } catch (error) {
    if (!String(error.message).includes("index not found")) {
      console.warn("Could not drop legacy diary index:", error.message);
    }
  }

  await mongoose.syncIndexes();
  indexesSynced = true;
  console.log("Connected to MongoDB");

  return mongoose.connection;
}

export { connectToDatabase };
