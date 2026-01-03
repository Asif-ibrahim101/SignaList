import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URL || "mongodb+srv://asifibrahim:sgwKBYUc6PQvios0@cluster0.p0zfvt6.mongodb.net/?appName=Cluster0";

declare global {
    var mongooseCache: { conn: typeof mongoose | null, promise: Promise<typeof mongoose> | null };
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
   if(!MONGODB_URI) {
    throw new Error('MONGODB_URL is not defined');
   }

   if(cached.conn) return cached.conn;

   if(!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {bufferCommands: false});
   }

   try {
    cached.conn = await cached.promise;
   } catch (error) {
    cached.promise = null;
    throw error;
   }

   console.log(`Connected to MongoDB: ${process.env.NODE_ENV} -  ${MONGODB_URI}`);
};