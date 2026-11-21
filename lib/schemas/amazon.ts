import { z } from "zod";
import {
  productRequestShape,
  type ProductRequest,
  type ProductResponse,
} from "./product";

export const amazonRequestSchema = z.object(productRequestShape);

export type AmazonRequest = ProductRequest;
export type AmazonResponse = ProductResponse;
