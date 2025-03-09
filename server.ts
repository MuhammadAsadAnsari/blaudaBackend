import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
import  {app,http}  from './app';

// 

  export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL, // Use Neon Database URL
    entities: ['models/*{.ts,.js}'],
    synchronize: true, // Change to false in production
    ssl: {
      rejectUnauthorized: false, // Required for Neon SSL connection
    },
  });
AppDataSource.initialize().then(()=>{console.log("db connected successfully")}).catch((error)=>{console.log("db connection failed",error)})
const port = process.env.PORT || 3000;
const server = http.listen(port, () => {
  console.log(`App running on port ${port}...`);
});



process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
