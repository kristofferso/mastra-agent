import { Stagehand } from "@browserbasehq/stagehand";
import { createTool } from "@mastra/core";
import { z } from "zod";
import { StagehandConfig } from "../../../stagehand.config";

// Initialize Stagehand instance
const stagehand = new Stagehand(StagehandConfig);

export const startBrowser = createTool({
  id: "start-browser",
  name: "startBrowser",
  description: "Start a new browser session",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async () => {
    try {
      await stagehand.init();
      return "Browser initialized";
    } catch (error) {
      console.error("Error starting browser:", error);
      return "Error starting browser. Error: " + error;
    }
  },
});

export const navigateTo = createTool({
  id: "navigate-to",
  name: "navigateTo",
  description: "Navigate to a specified URL",
  inputSchema: z.object({
    url: z.string().describe("URL to navigate to"),
  }),
  execute: async ({ context }) => {
    await stagehand.page.goto(context.url);
    return "Navigated to " + context.url;
  },
});

export const extractFromPage = createTool({
  id: "extract-from-page",
  name: "extract",
  description: "Extract information from the current page",
  inputSchema: z.object({
    instruction: z.string().describe("Instruction to extract information"),
  }),
  execute: async ({ context }) => {
    return await stagehand.page.extract(context.instruction);
  },
});

export const navigateToAndExtract = createTool({
  id: "navigate-to-and-extract",
  name: "navigateToAndExtract",
  description: "Navigate to a specified URL and extract information",
  inputSchema: z.object({
    url: z.string().describe("URL to navigate to"),
    instruction: z.string().describe("Instruction to extract information"),
  }),
  execute: async ({ context }) => {
    await stagehand.page.goto(context.url);
    return await stagehand.page.extract(context.instruction);
  },
});

export const actInBrowser = createTool({
  id: "act-in-browser",
  name: "actInBrowser",
  description:
    "Perform an action in the current browser context. For example, click the main menu and open settings",
  inputSchema: z.object({
    action: z.string().describe("Action to perform in the browser"),
  }),
  execute: async ({ context }) => {
    await stagehand.page.act(context.action);
    return "Action performed: " + context.action;
  },
});

process.on("beforeExit", () => {
  stagehand.close();
});
