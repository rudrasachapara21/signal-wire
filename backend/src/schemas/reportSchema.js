/**
 * reportSchema.js
 *
 * Zod validation schema for strategy reports.
 * Validates structure, strict types (e.g. number for confidenceScore),
 * no-markdown rules for human-readable strings, and business rules (allocation sum ~100%).
 */

import { z } from "zod";

/**
 * Custom Zod string validator rejecting markdown formatting syntax (*, _, #, `, ~, [, ]).
 */
const noMarkdownString = z
  .string({ required_error: "Value is required", invalid_type_error: "Must be a string" })
  .min(1, "String cannot be empty")
  .refine(
    (val) => !/[\*#_`~\[\]]/.test(val),
    { message: "Must not contain markdown formatting characters (*, _, #, `, ~, [, ])" }
  );

export const channelSchema = z.object({
  name: noMarkdownString,
  fit: z.number({ invalid_type_error: "fit must be a number" }).min(0, "fit score must be >= 0").max(100, "fit score must be <= 100"),
  allocation: z.string({ invalid_type_error: "allocation must be a string" }).regex(/^\d+%$/, "allocation must be a percentage string like '45%'"),
  reason: noMarkdownString,
});

export const creatorSchema = z.object({
  initials: z.string().min(1, "initials cannot be empty"),
  name: noMarkdownString,
  niche: noMarkdownString,
  audience: z.string().nullable(),
  match: z.number({ invalid_type_error: "match must be a number" }).min(0, "match score must be >= 0").max(100, "match score must be <= 100"),
  verified: z.boolean().default(false),
});

export const executiveRecommendationSchema = z.object({
  headline: noMarkdownString,
  body: noMarkdownString,
});

export const reportSchema = z
  .object({
    reportTitle: noMarkdownString,
    reportDate: z.string().min(1, "reportDate cannot be empty"),
    confidenceScore: z
      .number({ invalid_type_error: "confidenceScore must be a number" })
      .int("confidenceScore must be an integer")
      .min(0, "confidenceScore must be >= 0")
      .max(100, "confidenceScore must be <= 100"),
    channels: z
      .array(channelSchema)
      .min(1, "channels array must contain at least 1 channel"),
    creators: z
      .array(creatorSchema)
      .min(1, "creators array must contain at least 1 creator"),
    executiveRecommendation: executiveRecommendationSchema,
    first30Days: z
      .array(noMarkdownString)
      .min(1, "first30Days must contain at least 1 item"),
  })
  .superRefine((data, ctx) => {
    if (Array.isArray(data.channels) && data.channels.length > 0) {
      const sum = data.channels.reduce((acc, c) => {
        if (typeof c.allocation === "string") {
          const parsedVal = parseInt(c.allocation.replace("%", ""), 10);
          return acc + (isNaN(parsedVal) ? 0 : parsedVal);
        }
        return acc;
      }, 0);

      if (sum < 95 || sum > 105) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Channel allocations must sum to ~100% (currently ${sum}%)`,
          path: ["channels"],
        });
      }
    }
  });

/**
 * Validates a candidate report object against reportSchema.
 *
 * @param {any} data
 * @returns {{ success: true, data: any } | { success: false, errors: string[] }}
 */
export function validateReport(data) {
  const result = reportSchema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => {
      const pathStr = issue.path.join(".") || "root";
      return `${pathStr}: ${issue.message}`;
    });
    return {
      success: false,
      errors: formattedErrors,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}
