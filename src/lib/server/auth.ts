import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from './db';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
const BETTER_AUTH_SECRET = env.BETTER_AUTH_SECRET;
const BETTER_AUTH_BASE_URL = env.BETTER_AUTH_BASE_URL;
import bcrypt from 'bcryptjs';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: schema,
        usePlural: false
    }),
    emailAndPassword: {
        enabled: true,
        password: {
            verify: async ({ password, hash }: { password: string, hash: string }) => {
                return bcrypt.compare(password, hash);
            }
        }
    },
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_BASE_URL,
    user: {
        additionalFields: {
            username: { type: 'string' },
            display_name: { type: 'string' },
            bio: { type: 'string' },
            location: { type: 'string' },
            website: { type: 'string' },
            twitter_url: { type: 'string' },
            linkedin_url: { type: 'string' },
            github_url: { type: 'string' },
            theme_preference: { type: 'string' }
        }
    }
});
