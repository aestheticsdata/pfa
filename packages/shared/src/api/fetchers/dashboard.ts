import { HTTP_METHOD } from "#api/httpMethod";
import {
  DailyProjectionSchema,
  DashboardResponseSchema,
  MonthlyIncomeResponseSchema,
  MonthlyStatsSchema,
  WeeklyStatsSchema,
} from "#schemas/dashboard";

import type { Identified } from "#api/fetchers/interfaces/fetcherTypes";
import type { DashboardCreatePayload, DashboardUpdatePayload } from "#api/fetchers/interfaces/payloadTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";

// Every month route takes `start`: the month's 1st as yyyy-MM-dd, resolved client-side so the
// user's own calendar decides which month "today" is in.

/** The month's budget (`initialAmount`) and weekly ceiling (`initialCeiling`), or null before one is set. */
export const fetchDashboard = (api: ApiClient, monthStart: string) =>
  api.get("/dashboard", DashboardResponseSchema, { start: monthStart });

/** The month's spendings and fixed-expenses totals (COS-179). */
export const fetchMonthlyStats = (api: ApiClient, monthStart: string) =>
  api.get("/monthlystats", MonthlyStatsSchema, { from: monthStart });

/** The month's total per week, Sunday → Saturday truncated to the month. */
export const fetchWeeklyStats = (api: ApiClient, monthStart: string) =>
  api.get("/weeklystats", WeeklyStatsSchema, { start: monthStart });

/** The reference month behind the projected end of the month (COS-27). */
export const fetchDailyProjection = (api: ApiClient, monthStart: string) =>
  api.get("/dashboard/projection", DailyProjectionSchema, { start: monthStart });

/** Each month's budget over a year, Jan → Dec, null where none was set. */
export const fetchMonthlyIncome = (api: ApiClient, year: number) =>
  api.get("/dashboard/monthly-income", MonthlyIncomeResponseSchema, { year });

export const createDashboard = async (api: ApiClient, payload: DashboardCreatePayload) => {
  await api.request("/dashboard", { method: HTTP_METHOD.post, data: payload });
};

/** Changes the month's budget and/or weekly ceiling. */
export const updateDashboard = async (api: ApiClient, { id, payload }: Identified<DashboardUpdatePayload>) => {
  await api.request(`/dashboard/${id}`, { method: HTTP_METHOD.put, data: payload });
};
