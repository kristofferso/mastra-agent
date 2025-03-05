import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { browsingAgent, dataAnalystAgent } from "./agents";
import { weatherWorkflow } from "./workflows";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { dataAnalystAgent, browsingAgent },

  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
