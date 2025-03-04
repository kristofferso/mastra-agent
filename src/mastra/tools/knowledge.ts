import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Mock database of previous analyses
const mockAnalyses = [
  {
    id: "analysis-1",
    question: "What is the average order value by customer segment?",
    answer:
      "Our analysis shows that Enterprise customers have the highest average order value at $5,200, followed by SMB at $1,800, and Individual customers at $150. Enterprise segment shows 3x higher value than SMB.",
    attachments: ["order_value_chart.png"],
    url: "https://analytics.example.com/reports/customer-segments-2024",
    tags: ["customer segmentation", "revenue analysis", "order value"],
    created_at: "2024-01-15",
  },
  {
    id: "analysis-2",
    question: "Which products have the highest profit margin?",
    answer:
      "Premium subscription plans show the highest profit margin at 85%, followed by Enterprise licenses at 75%. Hardware products have lower margins ranging from 25-35% due to manufacturing and shipping costs.",
    attachments: ["margin_comparison.pdf", "product_profitability.xlsx"],
    url: "https://analytics.example.com/reports/product-profitability",
    tags: ["product analysis", "profitability", "margins"],
    created_at: "2024-02-01",
  },
  {
    id: "analysis-3",
    question: "What is the customer churn rate trend?",
    answer:
      "Monthly churn rate has decreased from 3.2% to 1.8% over the past quarter. This improvement is attributed to the new customer success program and improved product onboarding.",
    attachments: ["churn_trend.png", "retention_analysis.pdf"],
    url: "https://analytics.example.com/reports/churn-analysis-q1",
    tags: ["churn", "customer retention", "trend analysis"],
    created_at: "2024-03-01",
  },
];

export const searchKnowledge = createTool({
  id: "search-knowledge",
  name: "searchKnowledge",
  description: "Search for existing analysis answers and insights",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Search query or question to find relevant analyses"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags to filter analyses by"),
  }),

  execute: async ({ context }) => {
    const { query, tags } = context;

    // Simple search implementation - in the future, this would use proper text search
    let results = mockAnalyses.filter((analysis) => {
      const matchesQuery =
        analysis.question.toLowerCase().includes(query.toLowerCase()) ||
        analysis.answer.toLowerCase().includes(query.toLowerCase());

      if (!tags || tags.length === 0) {
        return matchesQuery;
      }

      const matchesTags = tags.some((tag) =>
        analysis.tags.includes(tag.toLowerCase())
      );

      return matchesQuery && matchesTags;
    });

    // Sort by date (newest first)
    results = mockAnalyses.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log("Matched results:", results);
    return {
      results: results.map((analysis) => ({
        question: analysis.question,
        answer: analysis.answer,
        attachments: analysis.attachments,
        url: analysis.url,
        created_at: analysis.created_at,
      })),
      count: results.length,
      message:
        results.length > 0
          ? `Found ${results.length} relevant analyses`
          : "No existing analyses found for this query",
    };
  },
});
