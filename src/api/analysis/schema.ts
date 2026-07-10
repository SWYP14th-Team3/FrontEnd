import { z } from 'zod';

// ── Enum 스키마 ────────────────────────────────────────

export const overallLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const matchStatusSchema = z.enum(['CONFIRMED', 'NEEDS_IMPROVEMENT', 'MISSING']);
export const requirementCategorySchema = z.enum(['자격요건', '업무역량', '도메인', '우대사항']);
export const jobInputTypeSchema = z.enum(['URL', 'TEXT']);
export const satisfactionSchema = z.enum(['LIKE', 'DISLIKE']).nullable();
export const satisfactionRequestValueSchema = z.enum(['LIKE', 'DISLIKE', 'NULL']);

// ── 중첩 엔티티 스키마 ─────────────────────────────────

export const evaluationSchema = z.object({
  evaluationId: z.number(),
  matchStatus: matchStatusSchema,
  resumeEvidence: z.string().nullable(),
  feedback: z.string().nullable(),
  revisionSuggestion: z.string().nullable(),
});

/** 공고 요건 (전체 필드 — 최초 분석/상세 조회용) */
export const requirementSchema = z.object({
  requirementId: z.number(),
  category: requirementCategorySchema,
  title: z.string(),
  description: z.string().nullable(),
  sourceText: z.string().nullable(),
  evaluation: evaluationSchema,
});

/** 공고 요건 (재분석용 — description, sourceText 미포함) */
export const reanalysisRequirementSchema = z.object({
  requirementId: z.number(),
  category: requirementCategorySchema,
  title: z.string(),
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
  retryCount: z.number(),
  remainingRetryCount: z.number(),
  satisfaction: satisfactionSchema,
  jobInputType: jobInputTypeSchema,
  jobUrl: z.string().nullable(),
  jobPostingRaw: z.string(),
  resumeOriginalText: z.string(),
  resumeCurrentText: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastSavedAt: z.string().nullable(),
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
  lastSavedAt: z.string().nullable(),
});

/** PATCH /analyses/{id}/resume 응답 data */
export const autoSaveResumeResponseSchema = z.object({
  analysisResultId: z.number(),
  resumeCurrentText: z.string(),
  updatedAt: z.string(),
});

/** POST /analyses/{id}/reanalyze 응답 data */
export const reanalyzeResponseSchema = z.object({
  analysisResultId: z.number(),
  overallLevel: overallLevelSchema,
  redCount: z.number(),
  yellowCount: z.number(),
  greenCount: z.number(),
  retryCount: z.number(),
  remainingRetryCount: z.number(),
  resumeCurrentText: z.string(),
  updatedAt: z.string(),
  requirements: z.array(reanalysisRequirementSchema),
});

/** PATCH /analyses/{id}/save 응답 data */
export const saveAnalysisResponseSchema = z.object({
  analysisResultId: z.number(),
  saved: z.boolean(),
  resumeCurrentText: z.string(),
  lastSavedAt: z.string(),
  updatedAt: z.string(),
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
