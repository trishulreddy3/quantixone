module.exports = {
    apps: [{
        name: "quantixone-backend",
        script: "./server.js",
        // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
        instances: "max",   // PM2 handles clustering if we set instances to max (or a number). If using PM2, we often don't need 'cluster' module in code.
        exec_mode: "cluster",  // Let PM2 load balance
        autorestart: true,
        watch: false,
        max_memory_restart: "1G", // Restart app if it exceeds 1GB memory to prevent memory leaks from crashing the system
        env: {
            NODE_ENV: "development",
            PORT: 5000,
            ENABLE_CLUSTERING: "false" // False because PM2 is handling clustering
        },
        env_production: {
            NODE_ENV: "production",
            PORT: 5000,
            ENABLE_CLUSTERING: "false"
        }
    }]
};
