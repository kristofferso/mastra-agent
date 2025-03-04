import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const InsightType = z.enum([
  "trend",
  "anomaly",
  "correlation",
  "distribution",
  "comparison",
]);

type InsightDetails = {
  trend: {
    before: number;
    after: number;
    change: number;
    unit?: string;
  };
  anomaly: {
    before: number;
    after: number;
    change: number;
    unit?: string;
  };
  correlation: {
    coefficient: number;
    direction: "positive" | "negative";
    strength: "weak" | "moderate" | "strong";
  };
  distribution: {
    peaks: number[];
    mean?: number;
    median?: number;
    unit?: string;
    shape: "normal" | "bimodal" | "skewed" | "uniform";
  };
  comparison: {
    difference: number;
    percentChange: number;
    unit?: string;
  };
};

interface Insight {
  type: z.infer<typeof InsightType>;
  description: string;
  importance: number; // 0-1 score
  confidence: number; // 0-1 score
  relatedColumns: string[];
  details: InsightDetails[keyof InsightDetails];
}

const OptionsSchema = z.object({
  minConfidence: z.number().min(0).max(1).default(0.7),
  maxInsights: z.number().default(5),
  insightTypes: z.array(InsightType).optional(),
});

type Options = z.infer<typeof OptionsSchema>;

export const discoverInsights = createTool({
  id: "discover-insights",
  name: "discoverInsights",
  description:
    "Automatically discover interesting patterns and insights in data",
  inputSchema: z.object({
    data: z.array(z.record(z.any())).describe("Dataset to analyze"),
    focus: z.object({
      metrics: z.array(z.string()).describe("Numeric columns to analyze"),
      dimensions: z
        .array(z.string())
        .optional()
        .describe("Categorical columns to group by"),
      timeColumn: z
        .string()
        .optional()
        .describe("Column containing timestamps"),
    }),
    options: OptionsSchema.optional(),
  }),

  execute: async ({ context }) => {
    const { data, focus } = context;
    const defaultOptions: Options = {
      minConfidence: 0.7,
      maxInsights: 5,
    };
    const options = context.options
      ? OptionsSchema.parse(context.options)
      : defaultOptions;

    const insights: Insight[] = [];

    // Mock insights discovery - in production this would use statistical analysis
    if (focus.timeColumn) {
      // Trend Analysis
      insights.push({
        type: "trend",
        description: "Significant upward trend detected in monthly revenue",
        importance: 0.9,
        confidence: 0.85,
        relatedColumns: ["revenue", "month"],
        details: {
          before: 100000,
          after: 150000,
          change: 0.5,
          unit: "USD",
        },
      });
    }

    // Correlation Analysis
    insights.push({
      type: "correlation",
      description:
        "Strong positive correlation between customer age and purchase value",
      importance: 0.8,
      confidence: 0.92,
      relatedColumns: ["customer_age", "purchase_value"],
      details: {
        coefficient: 0.78,
        direction: "positive",
        strength: "strong",
      },
    });

    // Anomaly Detection
    insights.push({
      type: "anomaly",
      description: "Unusual spike in order cancellations detected",
      importance: 0.95,
      confidence: 0.88,
      relatedColumns: ["cancellation_rate", "date"],
      details: {
        before: 0.02,
        after: 0.08,
        change: 4,
        unit: "ratio",
      },
    });

    // Distribution Analysis
    insights.push({
      type: "distribution",
      description: "Customer satisfaction scores show bimodal distribution",
      importance: 0.75,
      confidence: 0.82,
      relatedColumns: ["satisfaction_score"],
      details: {
        peaks: [3.2, 4.8],
        mean: 4.0,
        median: 4.2,
        unit: "score",
        shape: "bimodal",
      },
    });

    // Filter by confidence and sort by importance
    const filteredInsights = insights
      .filter((i) => i.confidence >= options.minConfidence)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, options.maxInsights);

    return {
      insights: filteredInsights,
      summary: `Discovered ${filteredInsights.length} significant insights in the data`,
      recommendations: [
        "Consider investigating the cause of increased cancellations",
        "Leverage age-based targeting for marketing campaigns",
        "Investigate factors causing bimodal satisfaction distribution",
      ],
    };
  },
});
