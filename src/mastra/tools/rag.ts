import { openai } from "@ai-sdk/openai";
import { createVectorQueryTool } from "@mastra/rag";
import { z } from "zod";

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "pgVector",
  indexName: "previous_queries",
  model: openai.embedding("text-embedding-3-small"),
});
