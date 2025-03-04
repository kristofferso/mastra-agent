import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { dataAnalystAgent } from "./agents";
import { weatherWorkflow } from "./workflows";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { dataAnalystAgent },

  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
