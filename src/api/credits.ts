import { get } from './client.js';
import { flattenSingle, type JsonApiSingleResponse } from './json-api.js';

export interface CreditUsage {
  total: number;
  used: number;
  remaining: number;
  byCategory?: Record<string, number>;
  period?: string;
}

export interface CreditSummary {
  totalUsage: number;
  billableUsage: number;
  freeRemaining: number;
  projectedFee?: number;
  billingPeriod?: string;
  resetDate?: string;
}

export async function getCreditUsage(): Promise<CreditUsage> {
  const response = await get<JsonApiSingleResponse>('/credits/usage');
  return flattenSingle<CreditUsage>(response);
}

export async function getCreditSummary(): Promise<CreditSummary> {
  const response = await get<JsonApiSingleResponse>('/credits/byok-usage-summary');
  return flattenSingle<CreditSummary>(response);
}
