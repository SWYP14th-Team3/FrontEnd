import { http, HttpResponse } from 'msw';

import { mockAnalysisResult, mockPaginatedAnalysisList, mockReanalysisRequirements } from '@/mocks/data/analysis';

const mockReanalyzeResponse = {
  analysisResultId: 1,
  overallLevel: 'HIGH' as const,
  redCount: 1,
  yellowCount: 2,
  greenCount: 4,
  retryCount: 1,
  remainingRetryCount: 4,
  resumeCurrentText: '재분석된 이력서 텍스트',
  updatedAt: '2025-07-10T10:00:00',
  requirements: mockReanalysisRequirements,
};

export const analysisHandlers = [
  http.post('/api/analyses', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 완료',
      data: mockAnalysisResult,
    });
  }),

  http.get('/api/analyses/:id', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 조회 성공',
      data: mockAnalysisResult,
    });
  }),

  http.get('/api/analyses', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 목록 조회 성공',
      data: mockPaginatedAnalysisList,
    });
  }),

  http.patch('/api/analyses/:id/resume', () => {
    return HttpResponse.json({
      status: 200,
      message: '이력서 자동 저장 성공',
      data: {
        analysisResultId: 1,
        resumeCurrentText: '수정된 이력서 텍스트',
        updatedAt: '2025-07-10T10:00:00',
      },
    });
  }),

  http.post('/api/analyses/:id/reanalyze', () => {
    return HttpResponse.json({
      status: 200,
      message: '재분석 완료',
      data: mockReanalyzeResponse,
    });
  }),

  http.patch('/api/analyses/:id/save', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 저장 성공',
      data: {
        analysisResultId: 1,
        saved: true,
        resumeCurrentText: '저장된 이력서 텍스트',
        lastSavedAt: '2025-07-10T10:30:00',
        updatedAt: '2025-07-10T10:30:00',
      },
    });
  }),

  http.delete('/api/analyses/:id', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 삭제 성공',
      data: {
        analysisResultId: 1,
        deleted: true,
        deletedAt: '2025-07-10T11:00:00',
      },
    });
  }),

  http.patch('/api/analyses/:id/satisfaction', () => {
    return HttpResponse.json({
      status: 200,
      message: '만족도 저장 성공',
      data: {
        analysisResultId: 1,
        satisfaction: 'LIKE',
        updatedAt: '2025-07-10T10:30:00',
      },
    });
  }),
];
