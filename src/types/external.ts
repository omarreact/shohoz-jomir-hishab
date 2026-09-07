import { z } from "zod";

export const ElevationResponseSchema = z.object({ elevation: z.array(z.number()).optional() }).passthrough();
export const FirebasePorchaItemSchema = z.object({ id: z.string().optional() }).passthrough();
export const FirebaseResponseSchema = z.object({ data: z.array(FirebasePorchaItemSchema).optional() }).passthrough();
