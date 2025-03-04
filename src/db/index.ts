import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

// Initialize the PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the database instance
export const db = drizzle(pool, { schema });

// Export types
export type Question = typeof schema.questions.$inferSelect;
export type NewQuestion = typeof schema.questions.$inferInsert;
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type QuestionAssignment = typeof schema.questionAssignments.$inferSelect;
export type NewQuestionAssignment =
  typeof schema.questionAssignments.$inferInsert;

// Export schema
export { schema };
