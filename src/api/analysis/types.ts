import type { z } from 'zod';
import type {
  overallLevelSchema,
  matchStatusSchema,
  requirementCategorySchema,
  jobInputTypeSchema,
  satisfactionSchema,
  satisfactionRequestValueSchema,
  evaluationSchema,
  requirementSchema,
  reanalysisRequirementSchema,
  analysisResultSchema,
  analysisListItemSchema,
  autoSaveResumeResponseSchema,
  reanalyzeResponseSchema,
  saveAnalysisResponseSchema,
  deleteAnalysisResponseSchema,
  updateSatisfactionResponseSchema,
  paginatedAnalysisListSchema,
} from './schema';

// ── Enum 타입 (스키마에서 추출) ────────────────────────

export type OverallLevel = z.infer<typeof overallLevelSchema>;
export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type RequirementCategory = z.infer<typeof requirementCategorySchema>;
export type JobInputType = z.infer<typeof jobInputTypeSchema>;
export type Satisfaction = z.infer<typeof satisfactionSchema>;
export type SatisfactionRequestValue = z.infer<typeof satisfactionRequestValueSchema>;

// ── 엔티티 타입 (스키마에서 추출) ──────────────────────

export type Evaluation = z.infer<typeof evaluationSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type ReanalysisRequirement = z.infer<typeof reanalysisRequirementSchema>;

// ── 응답 타입 (스키마에서 추출) ────────────────────────

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisListItem = z.infer<typeof analysisListItemSchema>;
export type AutoSaveResumeResponse = z.infer<typeof autoSaveResumeResponseSchema>;
export type ReanalyzeResponse = z.infer<typeof reanalyzeResponseSchema>;
export type SaveAnalysisResponse = z.infer<typeof saveAnalysisResponseSchema>;
export type DeleteAnalysisResponse = z.infer<typeof deleteAnalysisResponseSchema>;
export type UpdateSatisfactionResponse = z.infer<typeof updateSatisfactionResponseSchema>;
export type PaginatedAnalysisList = z.infer<typeof paginatedAnalysisListSchema>;

// ── 요청 타입 (스키마 불필요 — 우리가 보내는 데이터) ───

/** GET /analyses 쿼리 파라미터 */
export type AnalysesParams = {
  page?: number;
  size?: number;
  companyName?: string;
};

/** PATCH /analyses/{id}/resume 요청 바디 */
export type AutoSaveResumeRequest = {
  resumeCurrentText: string;
};

/** POST /analyses/{id}/reanalyze 요청 바디 */
export type ReanalyzeRequest = {
  resumeCurrentText: string;
};

/** PATCH /analyses/{id}/save 요청 바디 */
export type SaveAnalysisRequest = {
  resumeCurrentText: string;
};

/** PATCH /analyses/{id}/satisfaction 요청 바디 */
export type UpdateSatisfactionRequest = {
  satisfaction: SatisfactionRequestValue;
};
