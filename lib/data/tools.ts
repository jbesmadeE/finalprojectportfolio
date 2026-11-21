export type ToolIconKey = "bag" | "search" | "image" | "video" | "briefcase";

export type ToolInfo = {
  id: string;
  label: string;
  description: string;
  iconKey: ToolIconKey;
};

export const tools: ToolInfo[] = [
  {
    id: "walmart",
    label: "Walmart Product Finder",
    description: "Find promising Walmart products by keyword, price, and reviews.",
    iconKey: "bag",
  },
  {
    id: "amazon",
    label: "Amazon Product Finder",
    description: "Find promising Amazon products by keyword, price, and reviews.",
    iconKey: "bag",
  },
  {
    id: "seo",
    label: "SEO Website Analysis",
    description: "Analyze a page's SEO/AEO health and get prioritized fixes.",
    iconKey: "search",
  },
  {
    id: "image",
    label: "Image Generator",
    description: "Generate images from a prompt, size, and style.",
    iconKey: "image",
  },
  {
    id: "video",
    label: "Generate Video",
    description: "Generate short videos from a prompt.",
    iconKey: "video",
  },
  {
    id: "jobs",
    label: "Job Opportunities",
    description: "Search OnlineJobs.ph job listings by keyword.",
    iconKey: "briefcase",
  },
];
