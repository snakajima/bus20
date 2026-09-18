import { z } from "zod";

export const STOP_KINDS = ["pickup", "dropoff"] as const;
export const stopKindSchema = z.enum(STOP_KINDS);
export type StopKind = z.infer<typeof stopKindSchema>;

/** One planned service event on a vehicle's remaining route. */
export const stopSchema = z.object({
  requestId: z.string().min(1),
  kind: stopKindSchema,
  nodeId: z.string().min(1),
});
export type Stop = z.infer<typeof stopSchema>;
