import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import pg from "pg";

// Create a connection pool
const pool = new pg.Pool({
  connectionString: process.env.ANALYSIS_POSTGRES_CONNECTION_STRING,
});

// Ensure we have the connection string
if (!process.env.ANALYSIS_POSTGRES_CONNECTION_STRING) {
  throw new Error(
    "ANALYSIS_POSTGRES_CONNECTION_STRING environment variable is required"
  );
}

const queryDb = (query: string) => {
  console.log(`Executing query: ${query}`);
  return pool.query(query);
};

export const queryDatabase = createTool({
  id: "query-database",
  name: "queryDatabase",
  description: "Execute SQL queries against the database and return results",
  inputSchema: z.object({
    query: z.string().describe("SQL query to execute"),
  }),

  execute: async ({ context }) => {
    try {
      const { query } = context;

      // More precise SQL injection prevention
      const normalizedQuery = query.toLowerCase().trim();

      // Check for actual destructive operations at the start of the query
      const destructivePatterns = [
        /^drop\s+/i,
        /^truncate\s+/i,
        /^delete\s+from\s+/i,
        /^alter\s+table.*drop\s+/i,
      ];

      const isDestructive = destructivePatterns.some((pattern) =>
        pattern.test(normalizedQuery)
      );

      if (isDestructive) {
        console.log(`Blocked destructive query: ${query}`);
        throw new Error("Destructive operations are not allowed");
      }

      const result = await queryDb(query);

      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields.map((f) => ({
          name: f.name,
          dataType: f.dataTypeID,
        })),
      };
    } catch (error: any) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  },
});

export const getSchemaInfo = createTool({
  id: "get-schema-info",
  name: "getSchemaInfo",
  description:
    "Get information about the database schema including tables, columns, and relationships",
  inputSchema: z.object({
    table: z
      .string()
      .optional()
      .describe("Optional specific table name to get schema for"),
  }),

  execute: async ({ context }) => {
    try {
      const { table } = context;

      const query = table
        ? `
          SELECT 
            c.table_name,
            c.column_name,
            c.data_type,
            c.column_default,
            c.is_nullable,
            tc.constraint_type,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.columns c
          LEFT JOIN information_schema.key_column_usage kcu
            ON c.table_name = kcu.table_name 
            AND c.column_name = kcu.column_name
          LEFT JOIN information_schema.table_constraints tc
            ON kcu.constraint_name = tc.constraint_name
          LEFT JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE c.table_name = '${table}'
          ORDER BY c.ordinal_position;
        `
        : `
          SELECT 
            table_name,
            array_agg(column_name || ' ' || data_type) as columns
          FROM information_schema.columns
          WHERE table_schema = 'public'
          GROUP BY table_name
          ORDER BY table_name;
        `;

      const result = await queryDb(query);

      return {
        schema: result.rows,
        message: table
          ? `Schema information for table: ${table}`
          : "Overview of all tables in the database",
      };
    } catch (error: any) {
      throw new Error(`Schema query failed: ${error.message}`);
    }
  },
});
