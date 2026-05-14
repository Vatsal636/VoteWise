/**
 * @module lib/validation
 * @description Zod schemas for API input validation across all VoteWise AI endpoints.
 *
 * Provides type-safe request validation for:
 * - `/api/advice` — Assistant chat input
 * - `/api/impact` — Impact simulation parameters
 * - `/api/scanner` — Document upload validation
 */

import { z } from "zod";

/** Maximum allowed size for base64-encoded document images (10MB). */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for document scanner uploads. */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// ── Shared Schemas ──────────────────────────────────────────────────────────

/** Schema for the user profile object sent with all API requests. */
export const userProfileSchema = z.object({
  ageGroup: z.string().optional().default(""),
  isFirstTimeVoter: z.boolean().nullable().optional().default(null),
  location: z.string().optional().default(""),
  votingPlan: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        action: z.string(),
        reasoning: z.string(),
        confidence: z.enum(["Low", "Medium", "High"]).optional(),
        source: z.string().optional(),
      })
    )
    .optional(),
  language: z.string().optional().default("English"),
});

/** Schema for a single chat history message. */
const chatMessageSchema = z.object({
  role: z.string(),
  text: z.string(),
});

// ── Endpoint-Specific Schemas ───────────────────────────────────────────────

const defaultProfileData = {
  ageGroup: "",
  isFirstTimeVoter: null,
  location: "",
  language: "English",
};

/** Validates the `/api/advice` request body. */
export const adviceRequestSchema = z.object({
  query: z
    .string()
    .min(1, "Query is required and cannot be empty")
    .max(2000, "Query must be under 2000 characters"),
  profile: userProfileSchema.optional().default(defaultProfileData),
  history: z.array(chatMessageSchema).optional().default([]),
});

/** Validates the `/api/impact` request body. */
export const impactRequestSchema = z.object({
  profile: userProfileSchema.optional().default(defaultProfileData),
  selectedIssues: z
    .array(z.string().min(1))
    .min(2, "At least 2 issues are required")
    .max(10, "Maximum 10 issues allowed"),
});

/** Validates the `/api/scanner` request body. */
export const scannerRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "Image data is required")
    .refine(
      (val) => val.length <= MAX_IMAGE_SIZE_BYTES,
      `Image exceeds maximum size of ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`
    ),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    message: "Invalid image type",
  } as any),
  profile: userProfileSchema.optional().default(defaultProfileData),
});

// ── Response Helpers ────────────────────────────────────────────────────────

/** Standardized API success response. */
export function apiSuccess<T>(data: T) {
  return { success: true as const, data };
}

/** Standardized API error response. */
export function apiError(error: string, details?: z.ZodError) {
  return {
    success: false as const,
    error,
    ...(details && {
      validationErrors: details.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    }),
  };
}
