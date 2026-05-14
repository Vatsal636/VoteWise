/**
 * @file Validation schema tests for VoteWise AI API inputs.
 * @description Ensures Zod schemas correctly validate and reject API payloads.
 */

import {
  adviceRequestSchema,
  impactRequestSchema,
  scannerRequestSchema,
} from "@/lib/validation";

describe("adviceRequestSchema", () => {
  it("accepts a valid advice request with query and profile", () => {
    const input = {
      query: "I lost my voter ID",
      profile: {
        ageGroup: "18-25",
        isFirstTimeVoter: true,
        location: "California",
      },
      history: [],
    };
    const result = adviceRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("I lost my voter ID");
    }
  });

  it("rejects a request with an empty query", () => {
    const input = { query: "", profile: {} };
    const result = adviceRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects a request without a query field", () => {
    const input = { profile: {} };
    const result = adviceRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("impactRequestSchema", () => {
  it("accepts a valid impact request with 2+ issues", () => {
    const input = {
      selectedIssues: ["Education", "Healthcare"],
      profile: { location: "Texas" },
    };
    const result = impactRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects a request with fewer than 2 issues", () => {
    const input = {
      selectedIssues: ["Education"],
    };
    const result = impactRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("scannerRequestSchema", () => {
  it("accepts a valid scanner request with correct MIME type", () => {
    const input = {
      imageBase64: "iVBORw0KGgoAAAANSUhEUg...",
      mimeType: "image/jpeg",
      profile: {},
    };
    const result = scannerRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid MIME type", () => {
    const input = {
      imageBase64: "data...",
      mimeType: "application/pdf",
      profile: {},
    };
    const result = scannerRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects a request without image data", () => {
    const input = {
      imageBase64: "",
      mimeType: "image/png",
    };
    const result = scannerRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
