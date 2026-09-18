import { actionSchema } from "@bus20/contracts/action";
import { z } from "zod";

/** JSON Lines protocol between the policy host process and its parent. */
export const hostRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("load"),
    compiled: z.string().min(1),
    seed: z.int().nonnegative(),
    decisionTimeoutMs: z.int().positive(),
    loadTimeoutMs: z.int().positive(),
  }),
  z.object({ type: z.literal("decide"), observation: z.unknown() }),
]);

export const hostResponseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({
    type: z.literal("action"),
    action: actionSchema,
    usage: z.object({
      programCpuMs: z.number().nonnegative(),
      heapUsedBytes: z.int().nonnegative(),
    }),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type HostRequest = z.infer<typeof hostRequestSchema>;
export type HostResponse = z.infer<typeof hostResponseSchema>;
