import dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { EnvKey } from '../constants/env.constant';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env[EnvKey.DB_PORT]),
  username: process.env[EnvKey.DB_USERNAME],
  password: process.env[EnvKey.DB_PASSWORD],
  database: process.env[EnvKey.DB_DATABASE],
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrationsTableName: 'custom_migration_table',
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
  extra: {
    decimalNumbers: true,
  },
  cache: true,
};

export const AppDataSource = new DataSource(dataSourceOptions);

export default dataSourceOptions;
