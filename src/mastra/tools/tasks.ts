import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { questions, users, questionAssignments } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

const analysisTaskSchema = z.object({
  title: z.string().describe("Title of the analysis task"),
  content: z
    .string()
    .describe("Detailed description of what needs to be analyzed"),
  context: z.object({
    query: z.string().describe("The original query that led to this task"),
    data: z
      .record(z.any())
      .describe("Relevant data or query results")
      .optional(),
    uncertainty: z
      .string()
      .describe("Description of why human analysis is needed"),
    suggestedApproach: z
      .string()
      .optional()
      .describe("Optional suggested approach for the analyst"),
  }),
  referenceUrls: z
    .array(z.string())
    .optional()
    .describe("Related URLs or documentation"),
  assignTo: z
    .array(z.string())
    .optional()
    .describe("Email addresses of analysts to assign"),
});

export const createAnalysisTask = createTool({
  id: "create-analysis-task",
  name: "createAnalysisTask",
  description:
    "Create a task for human analysts when uncertain about data analysis results",
  inputSchema: analysisTaskSchema,

  execute: async ({ context }) => {
    try {
      const {
        title,
        content,
        context: taskContext,
        referenceUrls = [],
        assignTo = [],
      } = context;

      // Format the content with the context
      const formattedContent = `
## Analysis Request
${content}

## Original Query
${taskContext.query}

## Uncertainty Context
${taskContext.uncertainty}

${
  taskContext.suggestedApproach
    ? `
## Suggested Approach
${taskContext.suggestedApproach}
`
    : ""
}

## Relevant Data
\`\`\`json
${JSON.stringify(taskContext.data, null, 2)}
\`\`\`
`;

      // Create the question
      const [newQuestion] = await db
        .insert(questions)
        .values({
          title: title,
          content: formattedContent,
          status: "todo",
          referenceUrls: referenceUrls,
        })
        .returning();

      // Find and assign users if emails are provided
      if (assignTo.length > 0) {
        const assignedUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, assignTo[0])); // For now, just assign to the first user

        if (assignedUsers.length > 0) {
          // Create the assignment using the questionAssignments table
          await db.insert(questionAssignments).values({
            questionId: newQuestion.id,
            userId: assignedUsers[0].id,
          });
        }
      }

      return {
        taskId: newQuestion.id,
        status: "created",
        message: `Created analysis task "${title}" with ID ${newQuestion.id}${
          assignTo.length > 0 ? ` and assigned to ${assignTo.join(", ")}` : ""
        }`,
        viewUrl: `/tasks/${newQuestion.id}`, // Assuming there's a frontend route to view tasks
      };
    } catch (error) {
      console.error("Error creating analysis task:", error);
      return {
        error: "Failed to create analysis task",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
