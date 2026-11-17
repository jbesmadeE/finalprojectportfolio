import { z } from "zod";
import {
  productRequestShape,
  productResponseSchema,
  type ProductRequest,
  type ProductResponse,
} from "./product";

export const walmartRequestSchema = z.object(productRequestShape);
export const walmartResponseSchema = productResponseSchema;

export type WalmartRequest = ProductRequest;
export type WalmartResponse = ProductResponse;
