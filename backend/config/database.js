import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'afrikainfluence',
  process.env.DB_USER     || 'root',
  process.env.DB_PASS     || '',
  {
    host:    process.env.DB_HOST    || '127.0.0.1',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 10, min: 0, acquire: 30000, idle: 10000,
    },
  }
);

export default sequelize;
