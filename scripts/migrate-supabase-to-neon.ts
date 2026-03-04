import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/server/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env file from project root
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.log('No .env file found, using process.env');
    dotenv.config();
}

const SUPABASE_URL = process.env.SUPABASE_CONNECTION_STRING;
const NEON_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !NEON_URL) {
    console.error("Missing SUPABASE_CONNECTION_STRING or DATABASE_URL in .env");
    process.exit(1);
}

// Connect to Neon using neon-http
const sql = neon(NEON_URL);
const db = drizzle(sql, { schema });

// Connect to Supabase using node-postgres
const supabaseClient = new Client({
    connectionString: SUPABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    console.log("Starting Migration from Supabase to Neon...");

    try {
        await supabaseClient.connect();
        console.log("Connected to Supabase!");

        // 0. Fetch Auth Users from Supabase (internal schema)
        console.log("Fetching auth users from Supabase...");
        const { rows: authUsers } = await supabaseClient.query('SELECT * FROM auth.users');
        console.log(`Found ${authUsers.length} auth users.`);

        // 0.1 Clear all tables (Clean Slate in dependency order)
        console.log("Cleaning up all existing data in Neon...");
        await db.delete(schema.form_responses);
        await db.delete(schema.questions);
        await db.delete(schema.form_collaborators);
        await db.delete(schema.forms);
        await db.delete(schema.account);
        await db.delete(schema.user);
        console.log("Neon tables cleared.");

        // 1. Migrate Profiles and Users
        console.log("Migrating users and accounts...");
        for (const au of authUsers) {
            // Find corresponding profile
            const { rows: profiles } = await supabaseClient.query('SELECT * FROM profiles WHERE id = $1', [au.id]);
            const p = profiles[0] || {};

            console.log(`Migrating user: ${au.email} (${au.id})`);

            // Insert into 'user' table
            await db.insert(schema.user).values({
                id: au.id,
                name: p.display_name || p.username || au.email.split('@')[0],
                email: au.email,
                emailVerified: !!au.email_confirmed_at,
                createdAt: au.created_at ? new Date(au.created_at) : new Date(),
                updatedAt: au.last_sign_in_at ? new Date(au.last_sign_in_at) : (au.updated_at ? new Date(au.updated_at) : new Date()),
                username: p.username,
                display_name: p.display_name,
                theme_preference: p.theme_preference || 'light'
            });

            // Insert into 'account' table for Better Auth (Email/Password)
            if (au.encrypted_password) {
                // Use a deterministic ID for the account record itself to avoid duplicates
                const accountRecordId = `account_${au.id}`;

                await db.insert(schema.account).values({
                    id: accountRecordId,
                    userId: au.id,
                    accountId: au.email,
                    providerId: 'credential',
                    password: au.encrypted_password, // Hashed password from Supabase
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        console.log("Migrated auth users and profiles.");

        // 2. Migrate Forms
        console.log("Fetching forms from Supabase...");
        const { rows: formsData } = await supabaseClient.query('SELECT * FROM forms');
        console.log(`Found ${formsData.length} forms.`);

        if (formsData.length > 0) {
            for (const f of formsData) {
                await db.insert(schema.forms).values({
                    id: f.id,
                    user_id: f.user_id,
                    title: f.title,
                    slug: f.slug,
                    published: f.published,
                    closed: f.closed,
                    background_type: f.background_type,
                    background_color: f.background_color,
                    background_image: f.background_image,
                    theme: f.theme,
                    global_text_color: f.global_text_color,
                    thank_you_page: f.thank_you_page,
                    enable_checkin: f.enable_checkin,
                    checkin_name_field_id: f.checkin_name_field_id,
                    created_at: f.created_at,
                    updated_at: f.updated_at
                }).onConflictDoNothing();
            }
            console.log("Migrated forms.");
        }

        // 3. Migrate Questions
        console.log("Fetching questions from Supabase...");
        const { rows: questionsData } = await supabaseClient.query('SELECT * FROM questions');
        console.log(`Found ${questionsData.length} questions.`);
        if (questionsData.length > 0) {
            for (const q of questionsData) {
                await db.insert(schema.questions).values({
                    id: q.id,
                    form_id: q.form_id,
                    data: q.data,
                    order_index: q.order_index,
                    created_at: q.created_at,
                    updated_at: q.updated_at
                }).onConflictDoNothing();
            }
            console.log("Migrated questions.");
        }

        // 4. Migrate Collaborators
        console.log("Fetching collaborators from Supabase...");
        const { rows: collabData } = await supabaseClient.query('SELECT * FROM form_collaborators');
        if (collabData && collabData.length > 0) {
            for (const c of collabData) {
                await db.insert(schema.form_collaborators).values({
                    id: c.id,
                    form_id: c.form_id,
                    user_id: c.user_id,
                    role: c.role,
                    created_at: c.created_at
                }).onConflictDoNothing();
            }
            console.log("Migrated collaborators.");
        }

        // 5. Migrate Form Responses
        console.log("Fetching form responses from Supabase...");
        const { rows: responsesData } = await supabaseClient.query('SELECT * FROM form_responses');
        console.log(`Found ${responsesData.length} responses.`);
        if (responsesData.length > 0) {
            for (const r of responsesData) {
                await db.insert(schema.form_responses).values({
                    id: r.id,
                    form_id: r.form_id,
                    answers: r.answers,
                    checked_in: r.checked_in,
                    device_id: r.device_id,
                    created_at: r.created_at
                }).onConflictDoNothing();
            }
            console.log("Migrated responses.");
        }

        console.log("Migration complete!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await supabaseClient.end();
    }
}

runMigration();
