import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getAnalysis,
  getAnalyses,
  createAnalysis,
  autoSaveResume,
  reanalyze,
  saveAnalysis,
  deleteAnalysis,
  updateSatisfaction,
} from './api';
import type {
  AnalysesParams,
  AutoSaveResumeRequest,
  ReanalyzeRequest,
  SaveAnalysisRequest,
  UpdateSatisfactionRequest,
} from './types';

// ── Query Key Factory ────────────────────────────────
export const analysisKeys = {
  all: ['analysis'] as const,
  details: () => [...analysisKeys.all, 'detail'] as const,
  detail: (id: number) => [...analysisKeys.details(), id] as const,
  lists: () => [...analysisKeys.all, 'list'] as const,
  list: (params: AnalysesParams = {}) => [...analysisKeys.lists(), params] as const,
};

// ── Query Options ────────────────────────────────────

/** GET /analyses/{id} — 분석 결과 상세 조회 */
export function analysisDetailOptions(id: number) {
  return queryOptions({
    queryKey: analysisKeys.detail(id),
    queryFn: () => getAnalysis(id),
    staleTime: 5 * 60 * 1000, // 5분 — 재분석 전까지 불변
  });
}

/** GET /analyses — 분석 결과 목록 조회 / 검색 */
export function analysisListOptions(params: AnalysesParams = {}) {
  return queryOptions({
    queryKey: analysisKeys.list(params),
    queryFn: () => getAnalyses(params),
    staleTime: 30 * 1000, // 30초 — 다른 탭에서 삭제/재분석 가능
  });
}

// ── Mutation Hooks ──────────────────────────────────

/** POST /analyses — 이력서 + 공고 분석 생성 */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createAnalysis(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}

/** PATCH /analyses/{id}/resume — 이력서 편집본 자동저장 */
export function useAutoSaveResume(id: number) {
  return useMutation({
    mutationFn: (body: AutoSaveResumeRequest) => autoSaveResume(id, body),
  });
}

/** POST /analyses/{id}/reanalyze — 이력서 재분석 */
export function useReanalyze(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReanalyzeRequest) => reanalyze(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}

/** PATCH /analyses/{id}/save — 분석 결과 최종 저장 */
export function useSaveAnalysis(id: number) {
  return useMutation({
    mutationFn: (body: SaveAnalysisRequest) => saveAnalysis(id, body),
  });
}

/** DELETE /analyses/{id} — 분석 결과 삭제 */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAnalysis(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
      queryClient.removeQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}

/** PATCH /analyses/{id}/satisfaction — 분석 만족도 저장 */
export function useSatisfaction(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSatisfactionRequest) => updateSatisfaction(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}
