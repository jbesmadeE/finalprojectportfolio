import { z } from "zod";
import {
  productRequestShape,
  type ProductRequest,
  type ProductResponse,
} from "./product";

export const walmartRequestSchema = z.object(productRequestShape);

export type WalmartRequest = ProductRequest;
export type WalmartResponse = ProductResponse;
