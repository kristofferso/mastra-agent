import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Chart, ChartConfiguration, ChartData } from "chart.js/auto";
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { join } from "path";

// Register required Chart.js components
Chart.register();

const ChartType = z.enum([
  "line",
  "bar",
  "scatter",
  "pie",
  "doughnut",
  "radar",
  "bubble",
]);

type ChartInputType = z.infer<typeof ChartType>;

interface Dataset {
  label: string;
  data: number[];
}

interface ProcessedData {
  labels: string[];
  datasets: Dataset[];
}

const defaultColors = [
  "#4e79a7",
  "#f28e2c",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc949",
  "#af7aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ab",
];

const inputSchema = z.object({
  type: ChartType.describe("Type of chart to create"),
  data: z.array(z.record(z.any())).describe("Data to visualize"),
  xAxis: z.string().describe("Column to use for x-axis"),
  yAxis: z.string().describe("Column to use for y-axis"),
  title: z.string().optional().describe("Chart title"),
  groupBy: z.string().optional().describe("Column to group data by"),
  options: z
    .object({
      width: z.number().optional().default(800),
      height: z.number().optional().default(600),
      legend: z.boolean().optional().default(true),
      stacked: z.boolean().optional().default(false),
    })
    .optional(),
});

export const createVisualization = createTool({
  id: "create-visualization",
  name: "createVisualization",
  description: "Create data visualizations using Chart.js",
  inputSchema,

  execute: async ({ context }) => {
    const {
      type,
      data,
      xAxis,
      yAxis,
      title,
      groupBy,
      options: optionsInput,
    } = context;

    const options = optionsInput ?? ({} as any);

    const width = options.width || 800;
    const height = options.height || 600;

    // Process the data
    const processedData = processData(data, xAxis, yAxis, groupBy);

    // Create chart configuration
    const chartConfig: ChartConfiguration = {
      type: type as ChartInputType,
      data: {
        labels: processedData.labels,
        datasets: processedData.datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor: defaultColors[index % defaultColors.length],
          borderColor: defaultColors[index % defaultColors.length],
          fill: false,
        })),
      } as ChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales:
          type !== "pie" && type !== "doughnut"
            ? {
                x: {
                  title: {
                    display: true,
                    text: xAxis,
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: yAxis,
                  },
                },
              }
            : undefined,
        plugins: {
          title: {
            display: !!title,
            text: title || "",
          },
          legend: {
            display: options.legend !== false,
            position: "top",
          },
        },
      },
    };

    // Create canvas and chart
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // @ts-ignore - Chart.js types don't perfectly match with node-canvas
    new Chart(ctx, chartConfig);

    // Ensure the directory exists
    const chartDir = join(process.cwd(), "..", "..", "public", "charts");
    try {
      writeFileSync(join(chartDir, ".keep"), "");
    } catch (error) {
      // Directory already exists
    }

    // Save the chart
    const fileName = `chart-${Date.now()}.png`;
    const filePath = join(chartDir, fileName);
    writeFileSync(filePath, canvas.toBuffer("image/png"));

    return {
      chartUrl: `/charts/${fileName}`,
      config: chartConfig,
      dimensions: {
        width,
        height,
      },
      summary: `Created a ${type} chart comparing ${xAxis} vs ${yAxis}${
        title ? ` titled "${title}"` : ""
      }`,
    };
  },
});

function processData(
  data: Record<string, any>[],
  xAxis: string,
  yAxis: string,
  groupBy?: string
): ProcessedData {
  if (!groupBy) {
    // Simple x-y chart
    return {
      labels: data.map((item) => String(item[xAxis])),
      datasets: [
        {
          label: yAxis,
          data: data.map((item) => Number(item[yAxis]) || 0),
        },
      ],
    };
  }

  // Grouped data
  const groups = new Map<string, { x: string; y: number }[]>();
  data.forEach((item) => {
    const group = String(item[groupBy]);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)?.push({
      x: String(item[xAxis]),
      y: Number(item[yAxis]) || 0,
    });
  });

  const uniqueLabels = [...new Set(data.map((item) => String(item[xAxis])))];

  return {
    labels: uniqueLabels,
    datasets: Array.from(groups.entries()).map(([group, points]) => ({
      label: group,
      data: uniqueLabels.map(
        (label) => points.find((p) => p.x === label)?.y ?? 0
      ),
    })),
  };
}
