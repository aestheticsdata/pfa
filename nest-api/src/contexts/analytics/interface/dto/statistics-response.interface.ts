/**
 * Statistics API response format (GET /statistics).
 *
 * colors: { categoryName: hexColor }
 * data: { year: [ { month, categoryName: amount, ... } ] }
 *
 * @example
 * {
 *   colors: {
 *     "alimentation": "#ff339A",
 *     "foo": "#4756AB",
 *   },
 *   data: {
 *     2023: [
 *       { month: "Fev", alimentation: 3000, foo: 2388 },
 *       { month: "Mars", alimentation: 2000, foo: 2388 },
 *       ...
 *     ],
 *     2024: [...]
 *   }
 * }
 */
export interface StatisticsResponse {
  colors: Record<string, string>;
  data: Record<string, { month: string; [categoryName: string]: string | number }[]>;
}
