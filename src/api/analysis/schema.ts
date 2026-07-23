import { z } from 'zod';

// ── Enum 스키마 ────────────────────────────────────────

export const overallLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const matchStatusSchema = z.enum(['CONFIRMED', 'NEEDS_IMPROVEMENT', 'MISSING']);
export const requirementCategorySchema = z.enum(['자격요건', '업무역량', '도메인', '우대사항']);
export const jobInputTypeSchema = z.enum(['URL', 'TEXT', 'IMAGE']);
export const satisfactionSchema = z.enum(['LIKE', 'DISLIKE']).nullable();

// ── 중첩 엔티티 스키마 ─────────────────────────────────

export const evaluationSchema = z.object({
  evaluationId: z.number(),
  matchStatus: matchStatusSchema,
  displayTitle: z.string(),
  resumeEvidence: z.string().nullable(),
  judgeReason: z.string(),
  feedback: z.string().nullable(),
  revisionSuggestion: z.string().nullable(),
  effectScore: z.number().nullable(),
  effortScore: z.number().nullable(),
  priorityScore: z.number().nullable(),
  sortOrder: z.number(),
});

/** 공고 요건 */
export const requirementSchema = z.object({
  requirementId: z.number(),
  requirementType: z.enum(['REQUIRED', 'PREFERRED']),
  category: requirementCategorySchema,
  title: z.string(),
  description: z.string().nullable(),
  jdEvidence: z.string().nullable(),
  inputOrder: z.number(),
  evaluation: evaluationSchema,
});

// ── 분석 결과 응답 스키마 ──────────────────────────────

/** POST /analyses 응답 data & GET /analyses/{id} 응답 data */
export const analysisResultSchema = z.object({
  analysisResultId: z.number(),
  companyName: z.string().nullable(),
  positionTitle: z.string().nullable(),
  overallLevel: overallLevelSchema,
  redCount: z.number(),
  yellowCount: z.number(),
  greenCount: z.number(),
  previousOverallLevel: overallLevelSchema.nullable(),
  previousRedCount: z.number().nullable(),
  previousYellowCount: z.number().nullable(),
  previousGreenCount: z.number().nullable(),
  lastReanalyzedAt: z.string().nullable(),
  retryCount: z.number(),
  remainingRetryCount: z.number(),
  satisfaction: satisfactionSchema,
  jobInputType: jobInputTypeSchema,
  jobUrl: z.string().nullable(),
  jobPlatform: z.string().nullable(),
  jobOriginalText: z.string(),
  jobSummaryText: z.string(),
  resumeCurrentText: z.string(),
  resumeFileName: z.string().nullable(),
  resumeFileSize: z.number().nullable(),
  resumeLastSavedAt: z.string().nullable(),
  finalSavedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  requirements: z.array(requirementSchema),
});

/** GET /analyses 목록 아이템 */
export const analysisListItemSchema = z.object({
  analysisResultId: z.number(),
  companyName: z.string().nullable(),
  positionTitle: z.string().nullable(),
  overallLevel: overallLevelSchema,
  redCount: z.number(),
  yellowCount: z.number(),
  greenCount: z.number(),
  retryCount: z.number(),
  remainingRetryCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  finalSavedAt: z.string().nullable(),
});

/** PATCH /analyses/{id}/resume 응답 data */
export const autoSaveResumeResponseSchema = z.object({
  analysisResultId: z.number(),
  resumeCurrentText: z.string(),
  resumeLastSavedAt: z.string(),
  finalSavedAt: z.string().nullable(),
});

/** POST /analyses/{id}/reanalyze 응답 data */
export const reanalyzeResponseSchema = z.object({
  analysisResultId: z.number(),
  previousOverallLevel: overallLevelSchema,
  previousRedCount: z.number(),
  previousYellowCount: z.number(),
  previousGreenCount: z.number(),
  overallLevel: overallLevelSchema,
  redCount: z.number(),
  yellowCount: z.number(),
  greenCount: z.number(),
  lastReanalyzedAt: z.string(),
  retryCount: z.number(),
  remainingRetryCount: z.number(),
  resumeCurrentText: z.string(),
  resumeLastSavedAt: z.string(),
  finalSavedAt: z.string().nullable(),
  updatedAt: z.string(),
  requirements: z.array(requirementSchema),
});

/** PATCH /analyses/{id}/save 응답 data */
export const saveAnalysisResponseSchema = z.object({
  analysisResultId: z.number(),
  saved: z.boolean(),
  resumeCurrentText: z.string(),
  resumeLastSavedAt: z.string(),
  finalSavedAt: z.string(),
});

/** DELETE /analyses/{id} 응답 data */
export const deleteAnalysisResponseSchema = z.object({
  analysisResultId: z.number(),
  deleted: z.boolean(),
  deletedAt: z.string(),
});

/** PATCH /analyses/{id}/satisfaction 응답 data */
export const updateSatisfactionResponseSchema = z.object({
  analysisResultId: z.number(),
  satisfaction: satisfactionSchema,
  updatedAt: z.string(),
});

/** GET /analyses 페이지네이션 응답 data */
export const paginatedAnalysisListSchema = z.object({
  content: z.array(analysisListItemSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  last: z.boolean(),
});
