import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Db = NeonHttpDatabase<typeof schema>;

let dbInstance: Db | null = null;

function getDb(): Db {
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Neon PostgreSQL connection string is missing. Create a `.env` file with `DATABASE_URL`.',
    );
  }

  const sql = neon(url);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const activeDb = getDb();
    const value = activeDb[prop as keyof Db];
    return typeof value === 'function' ? value.bind(activeDb) : value;
  },
});

export default db;
