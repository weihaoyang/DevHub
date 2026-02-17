import { z } from "zod";
import type { SoftwareItem } from "../shared/types";

const softwareCategorySchema = z.enum([
  "browser",
  "dev",
  "runtime",
  "collab",
  "utility",
  "database",
  "creative",
  "music",
  "research"
]);

const softwareItemBaseSchema = z.object({
  id: z.string().min(1),
  name: z.object({
    zh: z.string().min(1),
    en: z.string().min(1)
  }),
  summary: z
    .object({
      zh: z.string().min(1),
      en: z.string().min(1)
    })
    .optional(),
  category: softwareCategorySchema,
  exact: z.boolean(),
  requiresAdmin: z.boolean(),
  enabledByDefault: z.boolean()
});

const wingetSoftwareItemSchema = softwareItemBaseSchema.extend({
  installType: z.literal("winget").optional().default("winget"),
  wingetId: z.string().min(1),
  manualUrl: z.string().url().optional()
});

const manualSoftwareItemSchema = softwareItemBaseSchema.extend({
  installType: z.literal("manual"),
  wingetId: z.string().optional(),
  manualUrl: z.string().url()
});

const softwareItemSchema = z.union([wingetSoftwareItemSchema, manualSoftwareItemSchema]);

const catalogSchema = z
  .array(softwareItemSchema)
  .min(1)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, "Duplicate software id");

export function validateCatalog(input: unknown): SoftwareItem[] {
  return catalogSchema.parse(input);
}
