import { z } from "zod";

export const jobsRequestSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(1, "Keyword is required.")
    .max(120, "Keyword is too long."),
});

export const jobListingSchema = z.object({
  title: z.string(),
  /** Employer/company name when exposed on the listing; otherwise null. */
  author: z.string().nullable(),
  /** Salary/rate as shown on OnlineJobs.ph (e.g. "$200/Month", "Monthly"). */
  rate: z.string(),
  /** Direct job posting URL. */
  url: z.string().url(),
  postedAt: z.string().nullable(),
  jobType: z.string().nullable(),
  categories: z.array(z.string()),
});

export const jobsResponseSchema = z.object({
  keyword: z.string(),
  total: z.number().int().nonnegative().nullable(),
  listings: z.array(jobListingSchema),
});

export type JobsRequest = z.infer<typeof jobsRequestSchema>;
export type JobListing = z.infer<typeof jobListingSchema>;
export type JobsResponse = z.infer<typeof jobsResponseSchema>;

