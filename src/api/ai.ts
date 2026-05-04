import { apiClient } from './client';

export interface DraftFollowupRequest {
  targetType: 'lead' | 'contact' | 'deal';
  targetId: number;
  tone: string;
  instructions?: string;
}

export interface DraftFollowupResponse {
  message: string;
  reason: string;
  confidence: number;
  suggestedAction: string;
  promptVersion: string;
  draftKind: 'human_review_required';
  model: string;
}

export interface AiUsageSummary {
  tenantId: string;
  feature: string;
  from: string;
  to: string;
  requestCount: number;
  successRate: number;
  avgLatencyMs: number;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
}

export const aiApi = {
  draftFollowup: (data: DraftFollowupRequest): Promise<DraftFollowupResponse> => {
    return apiClient.post('/ai/draft-followup', data);
  },

  getUsageSummary: (params?: { from?: string; to?: string }): Promise<AiUsageSummary> => {
    return apiClient.get('/ai/usage-summary', params);
  },
};
