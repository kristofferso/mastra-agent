import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { queryDatabase, getSchemaInfo } from "../tools/database";
import { vectorQueryTool } from "../tools/rag";
import { searchKnowledge } from "../tools/knowledge";
import { discoverInsights } from "../tools/insights";
import { createVisualization } from "../tools/visualization";
import { createAnalysisTask } from "../tools/tasks";
import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from "@mastra/pg";
import {
  extractFromPage,
  startBrowser,
  navigateTo,
  actInBrowser,
} from "../tools/browser";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Initialize memory with PostgreSQL storage and vector search
const memory = new Memory({
  storage: new PostgresStore({
    connectionString,
  }),
  vector: new PgVector(connectionString),
  options: {
    lastMessages: 10,
    semanticRecall: {
      topK: 3,
      messageRange: 2,
    },
  },
});

export const dataAnalystAgent = new Agent({
  name: "Data Analyst Agent",
  instructions: `
      I am a data analyst agent that can help analyze data and provide insights.
      I can:
      - Write efficient SQL queries to extract relevant information
      - Check previous similar questions using the searchKnowledge to avoid duplicate analysis
      - Provide clear, actionable insights from the data
      - Create data visualizations using Chart.js
      - Create tasks for human analysts when deeper analysis is needed

      Before writing new queries:
      - Always check previous similar questions using the searchKnowledge
      - Validate assumptions about the data structure using getSchemaInfo
      - Consider data quality and limitations

      When uncertain about analysis:
      - Create a task for human analysts using createAnalysisTask
      - Clearly explain why human analysis is needed
      - Provide all relevant context and data

      Keep responses concise but informative, and always validate data assumptions.

      Important notes: 
      - Avoid SQL queries that return too much data, such as queries that don't have an aggregate function. If you must, use a LIMIT clause to return only the necessary data or a sample. 
`,
  model: openai("gpt-4o"),
  memory,
  tools: {
    getSchemaInfo,
    queryDatabase,
    // vectorQueryTool,
    searchKnowledge,
    // discoverInsights,
    createVisualization,
    createAnalysisTask,
  },
});

export const browsingAgent = new Agent({
  name: "Web Browsing Agent",
  instructions: `
    I am a web browsing agent that can help navigate and interact with web pages.
    I can:
    - Navigate to specified URLs
    - Observe and identify elements on web pages
    - Extract information from web pages
    - Perform actions like clicking, typing, and form submission
    
    When browsing:
    - Always validate page loads successfully
    - Handle navigation errors gracefully
    - Ensure proper cleanup of browser resources
    - Follow ethical web scraping practices
    
    Important notes:
    - Respect website terms of service and robots.txt
    - Handle rate limiting and avoid overwhelming servers
    - Protect user privacy and sensitive data
    - If you are uncertain about how to navigate a website, ask for help
    - If you are uncertain about wether the content on the website answers a question, say "I don't know" and suggest next steps.
  `,
  model: openai("gpt-4o"),
  memory,
  tools: {
    startBrowser,
    navigateTo,
    actInBrowser,
    extractFromPage,
  },
});
