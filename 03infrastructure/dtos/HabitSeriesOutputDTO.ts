/**
 * HabitSeriesOutputDTO
 *
 * Infrastructure-level Data Transfer Object.
 *
 * Represents the exact response contract returned by
 * the POST /api/habits/series endpoint.
 *
 * This DTO:
 * - Is a serialized view of the result.
 * - Exposes only public, stable data.
 * - Uses primitives and explicit unions only.
 * - Does NOT depend on domain entities or value objects.
 *
 * Formatting, naming and structure are aligned with API consumers,
 * not with internal domain models.
 */
export class HabitSeriesOutputDTO {
  id: string;
  title: string;
  description: string;
  actions: {
    name: string;
    description: string;
    difficulty: "low" | "medium" | "high";
  }[];
  rank: "bronze" | "silver" | "golden" | "diamond";
  totalScore: number;
  createdAt: string;
  lastActivityAt: string; 
};