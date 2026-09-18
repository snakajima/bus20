import { dataSplitSchema, demandPatternSchema, loadLevelSchema } from "@bus20/contracts/manifest";
import { z } from "zod";

/** Configuration of one versioned synthetic suite. Everything is explicit and seeded. */
export const suiteConfigSchema = z.object({
  benchmarkVersion: z.string().min(1),
  seed: z.int().nonnegative(),
  cities: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        width: z.int().min(3),
        height: z.int().min(3),
        blockMeters: z.number().positive(),
        removeFraction: z.number().min(0).max(0.5),
        oneWayFraction: z.number().min(0).max(1),
        speedsMps: z.array(z.number().positive()).min(1),
        originLat: z.number(),
        originLon: z.number(),
      }),
    )
    .min(1),
  loads: z.partialRecord(loadLevelSchema, z.object({ targetUtilization: z.number().positive() })),
  patterns: z.array(demandPatternSchema).min(1),
  /** Hotspot burst; omitted means the generator's version-1 defaults (50% share, 40% to 55% of the window). */
  hotspot: z
    .object({
      share: z.number().min(0).max(1),
      burstStart: z.number().min(0).max(1),
      burstEnd: z.number().min(0).max(1),
    })
    .optional(),
  /** Scenarios per (city, load) cell in each split; patterns cycle within a cell. */
  splits: z.partialRecord(dataSplitSchema, z.int().nonnegative()),
  fleet: z.object({ vehicleCount: z.int().positive(), capacity: z.int().positive() }),
  timing: z.object({
    demandMinutes: z.int().positive(),
    deadlineMarginMinutes: z.int().positive(),
  }),
});

export type SuiteConfig = z.infer<typeof suiteConfigSchema>;
