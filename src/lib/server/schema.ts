import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, unique } from 'drizzle-orm/pg-core';

// Better Auth tables
export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    // Custom profile fields
    username: text('username').unique(),
    display_name: text('display_name'),
    bio: text('bio'),
    location: text('location'),
    website: text('website'),
    twitter_url: text('twitter_url'),
    linkedin_url: text('linkedin_url'),
    github_url: text('github_url'),
    theme_preference: text('theme_preference').default('light'),
});

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
        .notNull()
        .references(() => user.id),
});

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
        .notNull()
        .references(() => user.id),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt'),
    updatedAt: timestamp('updatedAt'),
});

// App tables
export const forms = pgTable('forms', {
    id: uuid('id').primaryKey().defaultRandom(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    title: text('title'),
    user_id: text('user_id')
        .notNull()
        .references(() => user.id),
    slug: text('slug'),
    published: boolean('published').default(false),
    closed: boolean('closed').default(false),
    background_type: text('background_type'), // 'color' or 'image'
    background_color: text('background_color'),
    background_image: text('background_image'),
    theme: jsonb('theme'),
    global_text_color: text('global_text_color'),
    thank_you_page: jsonb('thank_you_page'),
    enable_checkin: boolean('enable_checkin').default(false),
    checkin_name_field_id: text('checkin_name_field_id'),
});

export const questions = pgTable('questions', {
    id: uuid('id').primaryKey().defaultRandom(),
    form_id: uuid('form_id')
        .notNull()
        .references(() => forms.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(),
    order_index: integer('order_index').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const form_responses = pgTable('form_responses', {
    id: uuid('id').primaryKey().defaultRandom(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    form_id: uuid('form_id')
        .notNull()
        .references(() => forms.id, { onDelete: 'cascade' }),
    answers: jsonb('answers').notNull(),
    checked_in: boolean('checked_in').default(false),
    device_id: text('device_id'),
}, (t) => ({
    unq: unique().on(t.form_id, t.device_id)
}));

export const ip_rate_log = pgTable('ip_rate_log', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    ip_hash: text('ip_hash').notNull(),
    form_id: uuid('form_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const form_collaborators = pgTable('form_collaborators', {
    id: uuid('id').primaryKey().defaultRandom(),
    form_id: uuid('form_id')
        .notNull()
        .references(() => forms.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').default('editor'), // 'viewer' or 'editor'
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.form_id, t.user_id)
}));
export const templates = pgTable('templates', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(), // 'feedback', 'registration', 'jobs', 'capture', etc.
    icon: text('icon'), // emoji or icon name
    thumbnail_url: text('thumbnail_url'),
    questions_template: jsonb('questions_template').notNull(), // Array of question templates
    background_color: text('background_color'),
    theme_id: text('theme_id'),
    use_count: integer('use_count').default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});