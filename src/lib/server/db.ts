import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
const DATABASE_URL = env.DATABASE_URL;
import * as schema from './schema';

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
