import {
  pgTable, uuid, text, boolean,
  timestamp, integer, index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── users ───────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  sub:          text('sub').unique(),                  // OIDC subject claim (nullable for local-only users)
  email:        text('email').notNull().unique(),      // Email is now required and unique for account linking
  name:         text('name'),
  passwordHash: text('password_hash'),                 // Nullable for OIDC-only users
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

// ─── polls ───────────────────────────────────────────────────────────────────
export const polls = pgTable('polls', {
  id:          uuid('id').primaryKey().defaultRandom(),
  creatorId:   uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:       text('title').notNull(),
  description: text('description'),
  publicSlug:  text('public_slug').notNull().unique(),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  isActive:    boolean('is_active').notNull().default(true),
  expiresAt:   timestamp('expires_at'),           // null = never expires
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  slugIdx:    index('polls_slug_idx').on(t.publicSlug),
  creatorIdx: index('polls_creator_idx').on(t.creatorId),
}));

// ─── questions ───────────────────────────────────────────────────────────────
export const questions = pgTable('questions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  pollId:      uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  text:        text('text').notNull(),
  orderIndex:  integer('order_index').notNull().default(0),
  isMandatory: boolean('is_mandatory').notNull().default(true),
});

// ─── options ─────────────────────────────────────────────────────────────────
export const options = pgTable('options', {
  id:         uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  text:       text('text').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
});

// ─── responses ───────────────────────────────────────────────────────────────
export const responses = pgTable('responses', {
  id:           uuid('id').primaryKey().defaultRandom(),
  pollId:       uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  respondentId: uuid('respondent_id').references(() => users.id, { onDelete: 'set null' }),
  sessionToken: text('session_token'),            // used for anonymous mode
  submittedAt:  timestamp('submitted_at').defaultNow().notNull(),
}, (t) => ({
  pollIdx: index('responses_poll_idx').on(t.pollId),
  anonIdx: index('responses_anon_idx').on(t.pollId, t.sessionToken),
}));

// ─── answers ─────────────────────────────────────────────────────────────────
export const answers = pgTable('answers', {
  id:               uuid('id').primaryKey().defaultRandom(),
  responseId:       uuid('response_id').notNull().references(() => responses.id, { onDelete: 'cascade' }),
  questionId:       uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  selectedOptionId: uuid('selected_option_id').notNull().references(() => options.id),
});

// ─── Drizzle relations (for join helpers) ────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  polls:     many(polls),
  responses: many(responses),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  creator:   one(users,     { fields: [polls.creatorId],   references: [users.id] }),
  questions: many(questions),
  responses: many(responses),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  poll:    one(polls,   { fields: [questions.pollId], references: [polls.id] }),
  options: many(options),
  answers: many(answers),
}));

export const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, { fields: [options.questionId], references: [questions.id] }),
  answers:  many(answers),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  poll:       one(polls,  { fields: [responses.pollId],       references: [polls.id] }),
  respondent: one(users,  { fields: [responses.respondentId], references: [users.id] }),
  answers:    many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  response:       one(responses, { fields: [answers.responseId],       references: [responses.id] }),
  question:       one(questions, { fields: [answers.questionId],        references: [questions.id] }),
  selectedOption: one(options,   { fields: [answers.selectedOptionId],  references: [options.id] }),
}));
