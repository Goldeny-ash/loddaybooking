import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  globalThis.mongooseCache ||
  (globalThis.mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (mongoose.connection.readyState === 2 && cached.promise) {
    return cached.promise;
  }

  if (cached.conn && mongoose.connection.readyState === 0) {
    cached.conn = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // fail fast if cannot reach Atlas
      socketTimeoutMS: 45000,
      family: 4, // 🔥 FORCE IPv4 (fixes most ETIMEDOUT on Atlas)
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected");
  } catch (error) {
    cached.promise = null; // reset promise on failure
    cached.conn = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}
