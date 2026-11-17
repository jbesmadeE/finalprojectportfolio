import { z } from "zod";
import {
  productRequestShape,
  productResponseSchema,
  type ProductRequest,
  type ProductResponse,
} from "./product";

export const amazonRequestSchema = z.object(productRequestShape);
export const amazonResponseSchema = productResponseSchema;

export type AmazonRequest = ProductRequest;
export type AmazonResponse = ProductResponse;
