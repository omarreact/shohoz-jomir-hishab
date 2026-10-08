import { z } from "zod";

const optionalHttpUrl = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    "Cover image must be an HTTP(S) URL",
  );

export const blogWriteSchema = z.object({
  title: z.string().trim().min(5).max(180),
  coverImage: optionalHttpUrl.optional().default(""),
  category: z.string().trim().min(1).max(100),
  author: z.string().trim().min(1).max(100),
  content: z.string().min(10).max(1_000_000),
});

export const blogUpdateSchema = blogWriteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");
