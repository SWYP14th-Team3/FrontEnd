import { parseResponse } from '@/lib/parseResponse';
import {
  analysisResultSchema,
  autoSaveResumeResponseSchema,
  reanalyzeResponseSchema,
  saveAnalysisResponseSchema,
  deleteAnalysisResponseSchema,
  updateSatisfactionResponseSchema,
  paginatedAnalysisListSchema,
} from './schema';
import type {
  AnalysisResult,
  AnalysesParams,
  AutoSaveResumeRequest,
  AutoSaveResumeResponse,
  ReanalyzeRequest,
  ReanalyzeResponse,
  SaveAnalysisRequest,
  SaveAnalysisResponse,
  DeleteAnalysisResponse,
  UpdateSatisfactionRequest,
  UpdateSatisfactionResponse,
  PaginatedAnalysisList,
} from './types';

/** POST /analyses — 이력서 + 공고 분석 생성 (multipart/form-data) */
export async function createAnalysis(formData: FormData): Promise<AnalysisResult> {
  const res = await fetch('/api/analyses', {
    method: 'POST',
    body: formData,
  });
  return parseResponse(res, analysisResultSchema);
}

/** GET /analyses/{id} — 분석 결과 상세 조회 */
export async function getAnalysis(id: number): Promise<AnalysisResult> {
  const res = await fetch(`/api/analyses/${id}`);
  return parseResponse(res, analysisResultSchema);
}

/** GET /analyses — 분석 결과 목록 조회 / 회사명 검색 */
export async function getAnalyses(params: AnalysesParams = {}): Promise<PaginatedAnalysisList> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.companyName) searchParams.set('companyName', params.companyName);

  const query = searchParams.toString();
  const url = query ? `/api/analyses?${query}` : '/api/analyses';

  const res = await fetch(url);
  return parseResponse(res, paginatedAnalysisListSchema);
}

/** PATCH /analyses/{id}/resume — 이력서 편집본 자동저장 */
export async function autoSaveResume(id: number, body: AutoSaveResumeRequest): Promise<AutoSaveResumeResponse> {
  const res = await fetch(`/api/analyses/${id}/resume`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res, autoSaveResumeResponseSchema);
}

/** POST /analyses/{id}/reanalyze — 이력서 재분석 */
export async function reanalyze(id: number, body: ReanalyzeRequest): Promise<ReanalyzeResponse> {
  const res = await fetch(`/api/analyses/${id}/reanalyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res, reanalyzeResponseSchema);
}

/** PATCH /analyses/{id}/save — 분석 결과 최종 저장 */
export async function saveAnalysis(id: number, body: SaveAnalysisRequest): Promise<SaveAnalysisResponse> {
  const res = await fetch(`/api/analyses/${id}/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res, saveAnalysisResponseSchema);
}

/** DELETE /analyses/{id} — 분석 결과 삭제 */
export async function deleteAnalysis(id: number): Promise<DeleteAnalysisResponse> {
  const res = await fetch(`/api/analyses/${id}`, {
    method: 'DELETE',
  });
  return parseResponse(res, deleteAnalysisResponseSchema);
}

/** PATCH /analyses/{id}/satisfaction — 분석 만족도 저장 */
export async function updateSatisfaction(
  id: number,
  body: UpdateSatisfactionRequest,
): Promise<UpdateSatisfactionResponse> {
  const res = await fetch(`/api/analyses/${id}/satisfaction`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res, updateSatisfactionResponseSchema);
}
