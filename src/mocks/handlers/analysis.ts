import { http, HttpResponse } from 'msw';

import { mockAnalysisResult, mockPaginatedAnalysisList } from '@/mocks/data/analysis';

// 재분석 시 변경되는 상태
let reanalyzed = false;

const reanalyzedOverrides = {
  overallLevel: 'HIGH' as const,
  redCount: 1,
  yellowCount: 1,
  greenCount: 5,
  retryCount: 1,
  remainingRetryCount: 4,
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
    const data = reanalyzed
      ? {
          ...mockAnalysisResult,
          ...reanalyzedOverrides,
          previousOverallLevel: mockAnalysisResult.overallLevel,
          previousRedCount: mockAnalysisResult.redCount,
          previousYellowCount: mockAnalysisResult.yellowCount,
          previousGreenCount: mockAnalysisResult.greenCount,
          lastReanalyzedAt: '2025-07-10T10:00:00',
        }
      : mockAnalysisResult;
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 조회 성공',
      data,
    });
  }),

  http.get('/api/analyses', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 목록 조회 성공',
      data: mockPaginatedAnalysisList,
    });
  }),

  http.patch('/api/analyses/:id/resume', async ({ request }) => {
    const body = (await request.json()) as { resumeCurrentText: string };
    return HttpResponse.json({
      status: 200,
      message: '이력서 자동 저장 성공',
      data: {
        analysisResultId: 1,
        resumeCurrentText: body.resumeCurrentText,
        resumeLastSavedAt: new Date().toISOString(),
        finalSavedAt: null,
      },
    });
  }),

  http.post('/api/analyses/:id/reanalyze', () => {
    reanalyzed = true;
    return HttpResponse.json({
      status: 200,
      message: '재분석 완료',
      data: {
        analysisResultId: 1,
        previousOverallLevel: mockAnalysisResult.overallLevel,
        previousRedCount: mockAnalysisResult.redCount,
        previousYellowCount: mockAnalysisResult.yellowCount,
        previousGreenCount: mockAnalysisResult.greenCount,
        ...reanalyzedOverrides,
        lastReanalyzedAt: '2025-07-10T10:00:00',
        resumeCurrentText: mockAnalysisResult.resumeCurrentText,
        resumeLastSavedAt: '2025-07-10T10:00:00',
        finalSavedAt: null,
        updatedAt: '2025-07-10T10:00:00',
        requirements: mockAnalysisResult.requirements,
      },
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
        resumeLastSavedAt: '2025-07-10T10:30:00',
        finalSavedAt: '2025-07-10T10:30:00',
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
