const app = require('./app');
const mongoose = require('mongoose');
const cluster = require('cluster');
const os = require('os');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quantixone';
const ENABLE_CLUSTERING = process.env.ENABLE_CLUSTERING === 'true';

// ==========================================
// SERVER MANAGEMENT & SCALABILITY TECHNIQUES
// ==========================================

// 1. Database Connection with Connection Pooling
// Mongoose creates a connection pool globally. This helps handle multiple concurrent database operations.
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            maxPoolSize: 10, // Max 10 connections in the pool
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        console.log(`[Worker ${process.pid}] MongoDB Connected successfully`);
    } catch (err) {
        console.error(`[Worker ${process.pid}] MongoDB Connection Error:`, err.message);
        process.exit(1);
    }
};

// 2. Node.js Clustering for Load Balancing
// If we have a multi-core CPU, we can spin up multiple Node.js processes sharing the same port.
// This splits the load across multiple CPU threads instead of relying on a single thread.
if (ENABLE_CLUSTERING && cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`[Primary] Primary process ${process.pid} is running`);
    console.log(`[Primary] Forking ${numCPUs} workers...`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Handle worker exit - optionally restart them to maintain high availability
    cluster.on('exit', (worker, code, signal) => {
        console.log(`[Primary] Worker ${worker.process.pid} died with code ${code}. Restarting...`);
        cluster.fork();
    });

} else {
    // Workers can share any TCP connection. Here it is the HTTP server.
    connectDB().then(() => {
        const server = app.listen(PORT, () => {
            console.log(`[Worker ${process.pid}] Server is running on port ${PORT}`);
        });

        // 3. Graceful Shutdown Management
        // Ensures that active requests are finished before the server shuts down (prevents dropped connections on restart)
        const gracefulShutdown = () => {
            console.log(`[Worker ${process.pid}] Gracefully shutting down...`);
            server.close(() => {
                console.log(`[Worker ${process.pid}] Closed out remaining connections`);
                mongoose.connection.close(false, () => {
                    console.log(`[Worker ${process.pid}] MongoDB connection closed`);
                    process.exit(0);
                });
            });

            // Force shutdown after 10s if graceful takes too long
            setTimeout(() => {
                console.error(`[Worker ${process.pid}] Could not close connections in time, forcefully shutting down`);
                process.exit(1);
            }, 10000);
        };

        // Listen for termination signals (e.g. from PM2, Docker, or Ctrl+C)
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    });
}
