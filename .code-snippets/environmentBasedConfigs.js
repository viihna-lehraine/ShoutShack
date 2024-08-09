const config = {
    development: {
      db: 'mongodb://localhost/dev-db',
      port: 3000,
    },
    production: {
      db: process.env.MONGO_URI,
      port: process.env.PORT,
    },
  };
  
  const currentConfig = config[process.env.NODE_ENV || 'development'];