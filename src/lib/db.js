import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return a proxy that throws only when an actual database operation is triggered
    return new Proxy({}, {
      get(target, prop) {
        return () => {
          throw new Error(
            "Neon PostgreSQL connection string is missing. Please create a `.env` file in the project root and define your `DATABASE_URL` variable."
          );
        };
      }
    });
  }

  const sql = neon(url);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

// Proxy export to dynamically fetch the initialized Drizzle instance or trigger a helpful error
export const db = new Proxy({}, {
  get(target, prop) {
    const activeDb = getDb();
    const value = activeDb[prop];
    return typeof value === 'function' ? value.bind(activeDb) : value;
  }
});

export default db;
