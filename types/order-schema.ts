import * as z from "zod";

export const createOrderSchema = z.object({
  total: z.number(),
  status: z.string(),
  products: z.array(
    z.object({
      productID: z.number(),
      variantID: z.number(),
      quantity: z.number(),
    })
  ),
  paymentIntetnID: z.string(),
});
