import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Define the status enum
export const questionStatusEnum = pgEnum("question_status", [
  "todo",
  "progress",
  "doing",
  "done",
  "cancelled",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown
  status: questionStatusEnum("status").default("todo").notNull(),
  referenceUrls: text("reference_urls").array(), // Array of URLs
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Question assignments (many-to-many relationship)
export const questionAssignments = pgTable("question_assignments", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  assignedAt: timestamp("assigned_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Define relationships
export const questionsRelations = relations(questions, ({ many }) => ({
  assignments: many(questionAssignments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(questionAssignments),
}));

export const questionAssignmentsRelations = relations(
  questionAssignments,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionAssignments.questionId],
      references: [questions.id],
    }),
    user: one(users, {
      fields: [questionAssignments.userId],
      references: [users.id],
    }),
  })
);
