import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entity/User.js';
import { Game } from './entity/Game.js';
import { UserRating } from './entity/UserRating.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'chess',
  password: process.env.DB_PASSWORD ?? 'chess',
  database: process.env.DB_NAME ?? 'chess',
  synchronize: false,
  logging: false,
  entities: [User, Game, UserRating],
  migrations: ['src/migration/*.ts'],
});
