import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

const connectDB = async () => {
  // If no connection string provided, and we're in development, start an in-memory MongoDB
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'development') {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      process.env.MONGODB_URI = mongod.getUri();
      console.log('Using in-memory MongoDB for development');
    } catch (err) {
      console.warn('Failed to start in-memory MongoDB:', err.message || err);
      throw new Error('MONGODB_URI not set and in-memory MongoDB could not be started.');
    }
  }

  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set — skipping MongoDB connection');
    throw new Error('MONGODB_URI is required. Configure a reachable MongoDB database before starting AutoPulse AI.');
  }

  let uri;
  try {
    uri = new URL(process.env.MONGODB_URI);
  } catch {
    // If the URI is a mongodb connection string it may not parse with URL; allow it through to mongoose
    uri = null;
  }

  if (uri && !['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) {
    throw new Error('MONGODB_URI must use mongodb:// or mongodb+srv:.');
  }

  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected; the driver will retry automatically.'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected.'));
  mongoose.connection.on('error', (error) => console.error(`MongoDB connection error: ${error.message}`));

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log(`MongoDB connected: ${conn.connection.host || conn.connection.name || 'in-memory'}`);
  } catch (error) {
    console.error(`MongoDB error: ${error.message}`);
    throw new Error('AutoPulse AI requires MongoDB. Start MongoDB or update MONGODB_URI, then restart the server.');
  }
};

export default connectDB;
