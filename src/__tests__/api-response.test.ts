/**
 * @file API response structure tests for VoteWise AI.
 * @description Verifies standardized { success, data/error } response format from API helpers.
 */

import { apiSuccess, apiError } from "@/lib/validation";

describe("API Response Helpers", () => {
  describe("apiSuccess", () => {
    it("returns a success response with data", () => {
      const result = apiSuccess({ message: "Test data" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: "Test data" });
    });

    it("preserves complex nested data structures", () => {
      const data = {
        participationScenario: { points: ["point1", "point2"] },
        confidenceLevel: "Illustrative",
      };
      const result = apiSuccess(data);
      expect(result.success).toBe(true);
      expect(result.data.participationScenario.points).toHaveLength(2);
    });
  });

  describe("apiError", () => {
    it("returns a structured error response", () => {
      const result = apiError("Something went wrong");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Something went wrong");
    });

    it("does not include validationErrors when no ZodError is provided", () => {
      const result = apiError("Generic failure");
      expect(result).not.toHaveProperty("validationErrors");
    });
  });
});
