/**
 * Projects content shown in the bottom Projects carousel.
 * Drop images into /public/projects/ and set each `image` path
 * (e.g. "/projects/my-project.jpg"). `image: null` renders a styled
 * placeholder tile.
 */
export type Project = {
  id: string;
  title: string;
  /** Short caption shown in the project bottom sheet under the image. */
  description: string;
  /** Path under /public, or null while the real image is pending. */
  image: string | null;
  tags: string[];
};

export const projects: Project[] = [
  {
    id: "walmart-amazon-store-operations-1",
    title: "Walmart & Amazon Store Operations 1",
    description: "Walmart and Amazon store operations.",
    image: "/projects/project1.png",
    tags: ["Walmart", "Amazon", "Store Operations"],
  },
  {
    id: "walmart-amazon-store-operations-2",
    title: "Walmart & Amazon Store Operations 2",
    description: "Walmart and Amazon store operations.",
    image: "/projects/project2.png",
    tags: ["Walmart", "Amazon", "Store Operations"],
  },
  {
    id: "walmart-amazon-store-operations-3",
    title: "Walmart & Amazon Store Operations 3",
    description: "Walmart and Amazon store operations.",
    image: "/projects/project3.png",
    tags: ["Walmart", "Amazon", "Store Operations"],
  },
  {
    id: "walmart-amazon-store-operations-4",
    title: "Walmart & Amazon Store Operations 4",
    description: "Walmart and Amazon store operations.",
    image: "/projects/project4.png",
    tags: ["Walmart", "Amazon", "Store Operations"],
  },
  {
    id: "walmart-amazon-store-operations-5",
    title: "Walmart & Amazon Store Operations 5",
    description: "Walmart and Amazon store operations.",
    image: "/projects/project5.png",
    tags: ["Walmart", "Amazon", "Store Operations"],
  },
  {
    id: "walmart-amazon-store-operations-6",
    title: "Walmart & Amazon Store Operations 6",
    description: "Walmart and Amazon store operations.",
    image: "/projects/project6.png",
    tags: ["Walmart", "Amazon", "Store Operations"],
  },
];
