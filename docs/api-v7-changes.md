# API 명세서 v7 변경사항

> 최신 기능명세서 v7과 수정된 ERD를 기준으로 정리한 프론트엔드 반영 필요 사항

---

## 1. 인증 (Auth)

### 1-1. 소셜 로그인 응답 변경

기존 소셜 로그인 응답에 아래 필드 추가:

| 필드            | 타입      | 설명                     |
| --------------- | --------- | ------------------------ |
| `isNewUser`     | `boolean` | 최초 가입 사용자 여부    |
| `termsRequired` | `boolean` | 필수 약관 동의 필요 여부 |

**현재 구현 (localStorage 기반 — 교체 필요):**

| 파일                               | 현재 코드                                                    | v7 변경                                                       |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `LoginModal.tsx` (line 55, 78)     | `localStorage.getItem('terms_agreed')`로 약관 동의 여부 확인 | → API 응답의 `isNewUser`/`termsRequired`로 판단               |
| `SignupModal.tsx` (line 40)        | `localStorage.setItem('terms_agreed', 'true')`로 동의 저장   | → `POST /api/auth/agreements` API 호출로 교체                 |
| `LogoutConfirmModal.tsx` (line 28) | `localStorage.removeItem('terms_agreed')`                    | → 제거 (서버에서 관리하므로 불필요)                           |
| `api/auth/session/route.ts`        | 소셜 로그인 응답에 `isNewUser`/`termsRequired` 미처리        | → 응답에서 `isNewUser`/`termsRequired` 읽어 클라이언트로 전달 |

**v7 플로우:**

1. 소셜 로그인 성공 → API 응답의 `isNewUser`/`termsRequired` 확인
2. `termsRequired === true`이면 약관 동의 모달(SignupModal) 표시
3. 약관 동의 완료 시 `POST /api/auth/agreements` 호출
4. 성공하면 `termsRequired` 해소 → 서비스 진입
5. localStorage 관련 코드 전부 제거

### 1-2. 현재 사용자 조회 (GET /api/auth/me) 변경

기존 `userSchema`에 필드 추가:

| 필드            | 타입      | 설명                     |
| --------------- | --------- | ------------------------ |
| `termsRequired` | `boolean` | 필수 약관 동의 필요 여부 |

### 1-3. 약관 동의 저장 API (신규)

`POST /api/auth/agreements`

**Request:**

| key             | 타입      | Nullable | 설명                                                      |
| --------------- | --------- | -------- | --------------------------------------------------------- |
| `termsAgreed`   | `boolean` | N        | 서비스 이용약관 동의 여부                                 |
| `privacyAgreed` | `boolean` | N        | 개인정보 수집/이용 및 AI 분석을 위한 제3자 제공 동의 여부 |

**Response (data):**

| key               | 타입                | Nullable | 설명                         |
| ----------------- | ------------------- | -------- | ---------------------------- |
| `userId`          | `number`            | N        | 사용자 ID                    |
| `termsAgreedAt`   | `string` (ISO 8601) | N        | 서비스 이용약관 동의 시각    |
| `privacyAgreedAt` | `string` (ISO 8601) | N        | 개인정보 동의 시각           |
| `termsVersion`    | `string`            | N        | 동의한 서비스 이용약관 버전  |
| `privacyVersion`  | `string`            | N        | 동의한 개인정보처리방침 버전 |

**에러:**

| status | message                                                            |
| ------ | ------------------------------------------------------------------ |
| 400    | 서비스 이용약관에 동의해야 합니다.                                 |
| 400    | 개인정보 수집/이용 및 AI 분석을 위한 제3자 제공에 동의해야 합니다. |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다.                |
| 404    | 사용자를 찾을 수 없습니다.                                         |

### 1-4. 회원 탈퇴 API (신규)

`DELETE /api/auth/me`

**Request:** Body 없음 (Authorization 헤더만)

**Response:** `{ status: 200, message: "OK" }` (data 없음)

**에러:**

| status | message                        |
| ------ | ------------------------------ |
| 401    | 인증 정보가 유효하지 않습니다. |
| 404    | 사용자를 찾을 수 없습니다.     |

**참고:** 사용자 계정 및 관련 데이터를 영구 삭제하는 방향. 프론트에서는 탈퇴 후 쿠키 클리어 + 홈으로 리다이렉트 필요.

---

## 2. 분석 생성 (POST /api/analyses)

### Request

`Content-Type: multipart/form-data`

| key            | 타입     | 조건                                               | 설명                              |
| -------------- | -------- | -------------------------------------------------- | --------------------------------- |
| `resumeFile`   | `File`   | 필수, PDF, 최대 10MB                               | 분석할 이력서 (텍스트 기반 PDF만) |
| `jobInputType` | `string` | 필수, `URL` / `TEXT` / `IMAGE`                     | 공고 입력 방식                    |
| `jobUrl`       | `string` | `jobInputType=URL`일 때 필수                       | 공고 URL                          |
| `jobText`      | `string` | `jobInputType=TEXT`일 때 필수, 100~6000자          | 공고 텍스트                       |
| `jobImages`    | `File[]` | `jobInputType=IMAGE`일 때 필수, JPG/PNG, 최대 10장 | 공고 캡처 이미지                  |

### Response (data)

| key                    | 타입                          | Nullable | 설명                               |
| ---------------------- | ----------------------------- | -------- | ---------------------------------- |
| `analysisResultId`     | `number`                      | N        | 분석 결과 ID                       |
| `companyName`          | `string`                      | Y        | 회사명                             |
| `positionTitle`        | `string`                      | Y        | 포지션명                           |
| `overallLevel`         | `'HIGH' \| 'MEDIUM' \| 'LOW'` | N        | 전체 적합도 등급                   |
| `redCount`             | `number`                      | N        | 없음 개수                          |
| `yellowCount`          | `number`                      | N        | 보강 필요 개수                     |
| `greenCount`           | `number`                      | N        | 확인됨 개수                        |
| `previousOverallLevel` | `'HIGH' \| 'MEDIUM' \| 'LOW'` | Y        | 직전 재분석 전 등급                |
| `previousRedCount`     | `number`                      | Y        | 직전 재분석 전 없음 개수           |
| `previousYellowCount`  | `number`                      | Y        | 직전 재분석 전 보강 필요 개수      |
| `previousGreenCount`   | `number`                      | Y        | 직전 재분석 전 확인됨 개수         |
| `lastReanalyzedAt`     | `string`                      | Y        | 마지막 재분석 완료 시각 (ISO 8601) |
| `retryCount`           | `number`                      | N        | 성공한 재분석 횟수 (최대 5)        |
| `remainingRetryCount`  | `number`                      | N        | 남은 재분석 횟수 (0~5)             |
| `satisfaction`         | `'LIKE' \| 'DISLIKE'`         | Y        | 만족도                             |
| `jobInputType`         | `'URL' \| 'TEXT' \| 'IMAGE'`  | N        | 공고 입력 방식                     |
| `jobUrl`               | `string`                      | Y        | 공고 URL                           |
| `jobPlatform`          | `string`                      | Y        | 채용공고 플랫폼                    |
| `jobOriginalText`      | `string`                      | N        | 공고 원문 텍스트                   |
| `jobSummaryText`       | `string`                      | N        | 공고 요약 텍스트 (Markdown)        |
| `resumeCurrentText`    | `string`                      | N        | 현재 편집 중인 이력서 텍스트       |
| `resumeFileName`       | `string`                      | Y        | 이력서 파일명                      |
| `resumeFileSize`       | `number`                      | Y        | 이력서 파일 크기 (byte)            |
| `resumeLastSavedAt`    | `string`                      | Y        | 이력서 자동저장 시각 (ISO 8601)    |
| `finalSavedAt`         | `string`                      | Y        | 최종 저장 시각 (ISO 8601)          |
| `createdAt`            | `string`                      | N        | 분석 결과 생성일 (ISO 8601)        |
| `updatedAt`            | `string`                      | N        | 분석 결과 수정일 (ISO 8601)        |
| `requirements[]`       | 아래 참조                     | N        | 요건 배열                          |

### requirements[] 구조

| key                             | 타입                                                 | Nullable | 설명                                         |
| ------------------------------- | ---------------------------------------------------- | -------- | -------------------------------------------- |
| `requirementId`                 | `number`                                             | N        | 공고 요건 ID                                 |
| `requirementType`               | `'REQUIRED' \| 'PREFERRED'`                          | N        | 요건 유형                                    |
| `category`                      | `'자격요건' \| '업무역량' \| '도메인' \| '우대사항'` | N        | 요건 카테고리                                |
| `title`                         | `string`                                             | N        | 공고 요건명                                  |
| `description`                   | `string`                                             | Y        | 요건 설명                                    |
| `jdEvidence`                    | `string`                                             | Y        | 공고에서 해당 요건을 판단한 원문 근거        |
| `inputOrder`                    | `number`                                             | N        | LLM이 추출한 원래 순서                       |
| `evaluation.evaluationId`       | `number`                                             | N        | 요건 평가 ID                                 |
| `evaluation.matchStatus`        | `'CONFIRMED' \| 'NEEDS_IMPROVEMENT' \| 'MISSING'`    | N        | 매칭 상태                                    |
| `evaluation.displayTitle`       | `string`                                             | N        | 화면 노출용 제목                             |
| `evaluation.resumeEvidence`     | `string`                                             | Y        | 이력서에서 확인된 근거                       |
| `evaluation.judgeReason`        | `string`                                             | N        | 판정 근거 문장                               |
| `evaluation.feedback`           | `string`                                             | Y        | 상세 피드백                                  |
| `evaluation.revisionSuggestion` | `string`                                             | Y        | 수정 제안                                    |
| `evaluation.effectScore`        | `number` (1~5)                                       | Y        | 영향력 점수                                  |
| `evaluation.effortScore`        | `number` (1~5)                                       | Y        | 수정 난이도 점수                             |
| `evaluation.priorityScore`      | `number`                                             | Y        | 우선순위 점수 (`effectScore² / effortScore`) |
| `evaluation.sortOrder`          | `number`                                             | N        | 섹션 내 정렬 순서                            |

### 현재 구현과의 차이 (프론트 수정 필요 항목)

#### 스키마 변경 (`src/api/analysis/schema.ts`)

| 항목                              | 현재 코드                 | v7 변경                                          | 영향도      |
| --------------------------------- | ------------------------- | ------------------------------------------------ | ----------- |
| `jobInputTypeSchema`              | `z.enum(['URL', 'TEXT'])` | `z.enum(['URL', 'TEXT', 'IMAGE'])`               | 스키마 수정 |
| `jobPostingRaw`                   | `z.string()`              | 삭제 → `jobOriginalText: z.string()`             | 필드명 변경 |
| `jobSummaryText`                  | 없음                      | `z.string()` 추가                                | 신규        |
| `jobPlatform`                     | 없음                      | `z.string().nullable()` 추가                     | 신규        |
| `resumeOriginalText`              | `z.string()`              | 삭제                                             | 제거        |
| `resumeFileName`                  | 없음                      | `z.string().nullable()` 추가                     | 신규        |
| `resumeFileSize`                  | 없음                      | `z.number().nullable()` 추가                     | 신규        |
| `lastSavedAt`                     | `z.string().nullable()`   | 삭제 → `resumeLastSavedAt` + `finalSavedAt` 분리 | 필드 분리   |
| `previousOverallLevel`            | 없음                      | `overallLevelSchema.nullable()` 추가             | 신규        |
| `previous{Red,Yellow,Green}Count` | 없음                      | `z.number().nullable()` 추가 (3개)               | 신규        |
| `lastReanalyzedAt`                | 없음                      | `z.string().nullable()` 추가                     | 신규        |
| `sourceText` (requirement)        | `z.string().nullable()`   | 삭제 → `jdEvidence` 로 대체                      | 필드명 변경 |
| `requirementType`                 | 없음                      | `z.enum(['REQUIRED', 'PREFERRED'])` 추가         | 신규        |
| `inputOrder`                      | 없음                      | `z.number()` 추가                                | 신규        |
| `displayTitle` (evaluation)       | 없음                      | `z.string()` 추가                                | 신규        |
| `judgeReason` (evaluation)        | 없음                      | `z.string()` 추가                                | 신규        |
| `effectScore` (evaluation)        | 없음                      | `z.number().nullable()` 추가                     | 신규        |
| `effortScore` (evaluation)        | 없음                      | `z.number().nullable()` 추가                     | 신규        |
| `priorityScore` (evaluation)      | 없음                      | `z.number().nullable()` 추가                     | 신규        |
| `sortOrder` (evaluation)          | 없음                      | `z.number()` 추가                                | 신규        |

#### FormData 전송 (`src/app/_components/HomePage.tsx`)

| 항목             | 현재 코드                       | v7 변경                                                     |
| ---------------- | ------------------------------- | ----------------------------------------------------------- |
| IMAGE 분기       | 없음 (URL/TEXT만 처리)          | `jobInputType=IMAGE`일 때 `jobImages` 파일 배열 append 필요 |
| `jobImages` 상태 | UI에 존재하나 FormData에 미포함 | `formData.append('jobImages', file)` 루프로 추가            |

#### 컴포넌트 필드 참조 변경

| 파일                    | 현재 참조                             | v7 변경                                   |
| ----------------------- | ------------------------------------- | ----------------------------------------- |
| `ResultPageClient.tsx`  | `data.jobPostingRaw`                  | → `data.jobOriginalText`                  |
| `ResultPageClient.tsx`  | `data.lastSavedAt` 로컬 상태          | → `data.resumeLastSavedAt` 로 초기화      |
| `ResultPageClient.tsx`  | 자동저장 후 `response.updatedAt` 사용 | → `response.resumeLastSavedAt` 사용       |
| `RequirementsPanel.tsx` | prop `jobPostingRaw`                  | → prop `jobOriginalText`                  |
| `ResumePanel.tsx`       | prop `lastSavedAt`                    | → prop `resumeLastSavedAt`                |
| `SummaryCard.tsx`       | `previousCounts` 로컬 구성            | → API `previous*` 필드 직접 사용          |
| `RequirementGroup.tsx`  | `req.title` 사용                      | → `req.evaluation.displayTitle` 활용 고려 |

### 에러 응답

#### 입력 검증 (400)

| errorType                  | 메시지                                    |
| -------------------------- | ----------------------------------------- |
| `INVALID_PDF_FILE`         | PDF만 가능합니다.                         |
| `PDF_FILE_TOO_LARGE`       | 10MB 이하만 업로드할 수 있습니다.         |
| `INVALID_JOB_URL`          | 올바른 URL을 입력해주세요.                |
| `JOB_TEXT_TOO_SHORT`       | 공고 내용은 100자 이상 입력해주세요.      |
| `JOB_TEXT_TOO_LONG`        | 공고 내용은 6000자 미만으로 입력해주세요. |
| `TOO_MANY_JOB_IMAGES`      | 최대 10장까지 업로드 가능합니다.          |
| `INVALID_JOB_IMAGE_FORMAT` | JPG, PNG만 가능합니다.                    |

#### 분석 데이터 확보 실패 (422)

| errorType                            | 메시지                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `RESUME_LOAD_FAILED`                 | 이력서를 불러오지 못했어요. 파일을 다시 업로드한 뒤 분석을 시도해주세요.                                    |
| `JOB_POSTING_LOAD_FAILED`            | 채용공고를 불러오지 못했어요. URL은 그대로 두고 텍스트를 직접 붙여넣거나 공고 캡쳐 이미지를 업로드해주세요. |
| `RESUME_AND_JOB_POSTING_LOAD_FAILED` | 이력서와 채용공고를 불러오지 못했어요. 파일을 다시 업로드하고, 채용공고 내용을 직접 붙여넣어주세요.         |

#### 기타

| status | errorType               | 메시지                                 |
| ------ | ----------------------- | -------------------------------------- |
| 401    | `UNAUTHORIZED`          | 인증 정보가 유효하지 않습니다.         |
| 503    | `ANALYSIS_FAILED`       | 분석에 실패했어요. 다시 시도해주세요.  |
| 500    | `INTERNAL_SERVER_ERROR` | 분석 생성 중 서버 오류가 발생했습니다. |

---

## 4. 분석 결과 상세 조회 (GET /api/analyses/{analysisResultId})

### 변경 요약

- 응답 구조가 **2번 분석 생성(POST /api/analyses) 응답과 완전히 동일**
- 현재 코드에서도 `getAnalysis()`와 `createAnalysis()`가 같은 `analysisResultSchema`를 공유하므로, 2번의 스키마 변경이 자동 적용됨
- `resumeLastSavedAt`과 `finalSavedAt` 분리 반환
- `previous*` 필드로 재분석 전후 등급/카운트 반환 (UI는 GradeChangeBar/ChangeBadge로 이미 구현되어 있음, 현재는 로컬 상태로 처리 중 → API 필드로 전환)
- 삭제된 결과(`deletedAt`이 있는 건)는 조회 대상에서 제외 (프론트에서 별도 처리 불필요, 백엔드에서 404 반환)

### Request

`GET /api/analyses/{analysisResultId}`

| 파라미터           | 위치 | 타입     | 설명                |
| ------------------ | ---- | -------- | ------------------- |
| `analysisResultId` | Path | `number` | 조회할 분석 결과 ID |

Body, Query parameter 없음.

### Response

2번 분석 생성 응답의 `data` 구조와 동일. (requirements 포함 전체 상세)

### 에러

| status | message                                             |
| ------ | --------------------------------------------------- |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다. |
| 403    | 해당 분석 결과에 접근할 권한이 없습니다.            |
| 404    | 분석 결과를 찾을 수 없습니다.                       |

### 현재 구현과의 차이

스키마를 공유하므로 **2번의 스키마 변경만 반영하면 자동 적용**. 추가 수정 없음.

단, `ResultPageClient.tsx`에서 `previous*` 필드를 API 응답에서 직접 읽어 `SummaryCard`/`GradeChangeBar`에 전달하도록 연결 로직 변경 필요.

---

## 5. 분석 결과 목록 및 회사명 검색 (GET /api/analyses)

### Request

`GET /api/analyses?page={page}&size={size}&companyName={keyword}`

| 파라미터      | 위치  | 타입     | 기본값 | 설명                                              |
| ------------- | ----- | -------- | ------ | ------------------------------------------------- |
| `page`        | Query | `number` | `0`    | 조회할 페이지 번호 (0부터 시작)                   |
| `size`        | Query | `number` | `10`   | 한 페이지당 조회 개수                             |
| `companyName` | Query | `string` | -      | 회사명 검색어 (JOB_DESCRIPTION.company_name 기준) |

Body 없음.

### Response (data)

| key                             | 타입                          | Nullable | 설명                        |
| ------------------------------- | ----------------------------- | -------- | --------------------------- |
| `content[].analysisResultId`    | `number`                      | N        | 분석 결과 ID                |
| `content[].companyName`         | `string`                      | Y        | 회사명                      |
| `content[].positionTitle`       | `string`                      | Y        | 포지션명                    |
| `content[].overallLevel`        | `'HIGH' \| 'MEDIUM' \| 'LOW'` | N        | 전체 적합도 등급            |
| `content[].redCount`            | `number`                      | N        | 없음 개수                   |
| `content[].yellowCount`         | `number`                      | N        | 보강 필요 개수              |
| `content[].greenCount`          | `number`                      | N        | 확인됨 개수                 |
| `content[].retryCount`          | `number`                      | N        | 성공한 재분석 횟수 (최대 5) |
| `content[].remainingRetryCount` | `number`                      | N        | 남은 재분석 횟수 (0~5)      |
| `content[].createdAt`           | `string`                      | N        | 분석 결과 생성일 (ISO 8601) |
| `content[].updatedAt`           | `string`                      | N        | 분석 결과 수정일 (ISO 8601) |
| `content[].finalSavedAt`        | `string`                      | Y        | 최종 저장 시각 (ISO 8601)   |
| `page`                          | `number`                      | N        | 현재 페이지                 |
| `size`                          | `number`                      | N        | 한 페이지당 조회 개수       |
| `totalElements`                 | `number`                      | N        | 전체 분석 결과 개수         |
| `totalPages`                    | `number`                      | N        | 전체 페이지 수              |
| `last`                          | `boolean`                     | N        | 마지막 페이지 여부          |

**날짜 표시 규칙:** `finalSavedAt`이 있으면 최종 저장 시각 표시, `null`이면 `createdAt` 또는 `updatedAt` 기준.

**빈 상태:** 결과 없어도 200 OK, `content: []`, `totalElements: 0`.

### 에러

| status | message                                             |
| ------ | --------------------------------------------------- |
| 400    | 잘못된 페이지 요청입니다.                           |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다. |

### 변경 정책

- 생성 직후 초안도 목록에 노출
- `deletedAt`이 있는 분석 결과는 목록 및 검색에서 제외 (백엔드 처리)
- 회사명/포지션은 JOB_DESCRIPTION 기준 조회
- 페이지당 기본 10개, 최신순 조회 유지

### 현재 구현과의 차이

#### 스키마 (`src/api/analysis/schema.ts` — `analysisListItemSchema`)

| 항목          | 현재 코드               | v7 변경                                               |
| ------------- | ----------------------- | ----------------------------------------------------- |
| `lastSavedAt` | `z.string().nullable()` | → `finalSavedAt: z.string().nullable()` (필드명 변경) |

그 외 필드는 명세서와 현재 스키마가 일치. 필드명 변경 1건만 반영하면 됨.

#### 이슈 #47 수정 필요

이슈에 "백엔드 스펙과 완전 일치 확인 완료. 수정 없이 사용"이라고 되어 있으나, `lastSavedAt` → `finalSavedAt` 변경 반영 필요. 이슈 본문 업데이트 권장:

- 스키마에서 `lastSavedAt` → `finalSavedAt` 필드명 변경
- 카드 날짜 표시: `finalSavedAt ?? createdAt` 로직 명시
- MSW 목 데이터도 `finalSavedAt` 필드로 갱신

---

## 6. 이력서 자동저장 (PATCH /api/analyses/{analysisResultId}/resume)

### 변경 요약

- 저장 대상이 ANALYSIS_RESULT → USER_RESUME으로 변경 (백엔드 내부, 프론트 영향 없음)
- 응답 필드 `updatedAt` 제거 → `resumeLastSavedAt` + `finalSavedAt` 으로 대체
- 최종 저장(finalSavedAt이 있는 상태) 후 이력서를 다시 수정하면 `finalSavedAt`이 `null`로 초기화됨

### Request

`PATCH /api/analyses/{analysisResultId}/resume`

| key                 | 위치 | 타입     | 설명                         |
| ------------------- | ---- | -------- | ---------------------------- |
| `analysisResultId`  | Path | `number` | 분석 결과 ID                 |
| `resumeCurrentText` | Body | `string` | 현재 편집 중인 이력서 텍스트 |

### Response (data)

| key                 | 타입     | Nullable | 설명                                   |
| ------------------- | -------- | -------- | -------------------------------------- |
| `analysisResultId`  | `number` | N        | 분석 결과 ID                           |
| `resumeCurrentText` | `string` | N        | 저장된 최신 이력서 텍스트              |
| `resumeLastSavedAt` | `string` | N        | 이력서 편집본 자동저장 시각 (ISO 8601) |
| `finalSavedAt`      | `string` | Y        | 최종 저장 시각 (수정 후 null로 초기화) |

### 에러

| status | message                                     |
| ------ | ------------------------------------------- |
| 400    | resumeCurrentText는 필수입니다.             |
| 401    | 인증 정보가 유효하지 않거나 만료되었습니다. |
| 403    | 해당 분석 결과를 수정할 권한이 없습니다.    |
| 404    | 분석 결과를 찾을 수 없습니다.               |

### 현재 구현과의 차이

#### 스키마 (`src/api/analysis/schema.ts` — `autoSaveResumeResponseSchema`)

| 항목                | 현재 코드    | v7 변경                      |
| ------------------- | ------------ | ---------------------------- |
| `updatedAt`         | `z.string()` | 삭제                         |
| `resumeLastSavedAt` | 없음         | `z.string()` 추가            |
| `finalSavedAt`      | 없음         | `z.string().nullable()` 추가 |

#### 컴포넌트 (`src/app/result/[id]/_components/ResultPageClient.tsx`)

| 항목             | 현재 코드                                                          | v7 변경                                        |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| 로컬 상태        | `const [lastSavedAt, setLastSavedAt] = useState(data.lastSavedAt)` | → `useState(data.resumeLastSavedAt)`           |
| 자동저장 콜백    | `setLastSavedAt(response.updatedAt)` (line 43)                     | → `setLastSavedAt(response.resumeLastSavedAt)` |
| ResumePanel prop | `lastSavedAt={lastSavedAt}` (line 130)                             | prop명도 `resumeLastSavedAt`으로 변경 고려     |

#### `finalSavedAt` 초기화 처리

자동저장 응답에 `finalSavedAt: null`이 올 수 있으므로, 최종 저장 상태를 별도 관리하는 경우 이 값으로 UI 갱신 필요 (예: "최종 저장됨" 뱃지 제거).

---

## 7. 분석 결과 최종 저장 (PATCH /api/analyses/{analysisResultId}/save)

### 변경 요약

- 저장 대상이 USER_RESUME으로 변경 (백엔드 내부, 프론트 영향 없음)
- `lastSavedAt` → `finalSavedAt`, `updatedAt` → `resumeLastSavedAt`으로 필드명 변경
- 버전 관리 없이 최신 상태 1건만 유지

### Request

`PATCH /api/analyses/{analysisResultId}/save`

| key                 | 위치 | 타입     | 설명                             |
| ------------------- | ---- | -------- | -------------------------------- |
| `analysisResultId`  | Path | `number` | 최종 저장할 분석 결과 ID         |
| `resumeCurrentText` | Body | `string` | 최종 저장할 이력서 편집본 텍스트 |

### Response (data)

| key                 | 타입      | Nullable | 설명                                |
| ------------------- | --------- | -------- | ----------------------------------- |
| `analysisResultId`  | `number`  | N        | 분석 결과 ID                        |
| `saved`             | `boolean` | N        | 최종 저장 성공 여부                 |
| `resumeCurrentText` | `string`  | N        | 최종 저장된 이력서 텍스트           |
| `resumeLastSavedAt` | `string`  | N        | 이력서 편집본 저장 시각 (ISO 8601)  |
| `finalSavedAt`      | `string`  | N        | 분석 결과 최종 저장 시각 (ISO 8601) |

### 에러

| status | message                                                       |
| ------ | ------------------------------------------------------------- |
| 400    | resumeCurrentText는 필수입니다. / 이력서 내용을 입력해주세요. |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다.           |
| 403    | 해당 분석 결과를 저장할 권한이 없습니다.                      |
| 404    | 분석 결과를 찾을 수 없습니다.                                 |

### 현재 구현과의 차이

#### 스키마 (`src/api/analysis/schema.ts` — `saveAnalysisResponseSchema`)

| 항목          | 현재 코드    | v7 변경                                         |
| ------------- | ------------ | ----------------------------------------------- |
| `lastSavedAt` | `z.string()` | → `finalSavedAt: z.string()` (필드명 변경)      |
| `updatedAt`   | `z.string()` | → `resumeLastSavedAt: z.string()` (필드명 변경) |

---

## 8. 이력서 재분석 (POST /api/analyses/{analysisResultId}/reanalyze)

### 변경 요약

- 기존 JOB_REQUIREMENT는 유지, 최신 이력서와의 매칭 평가만 재수행
- 성공 시에만 `retryCount` 증가 (최대 5회, 실패 시 미차감)
- 재분석 직전 등급/카운트를 `previous*` 필드에 저장하여 응답에 포함
- `lastReanalyzedAt` 갱신
- 재분석 후 새로운 초안 → `finalSavedAt`은 `null`로 초기화
- **재분석 응답에도 full requirement 반환** (기존 slim 스키마 폐기)

### Request

`POST /api/analyses/{analysisResultId}/reanalyze`

| key                 | 위치 | 타입     | 설명                        |
| ------------------- | ---- | -------- | --------------------------- |
| `analysisResultId`  | Path | `number` | 재분석할 분석 결과 ID       |
| `resumeCurrentText` | Body | `string` | 재분석할 최신 이력서 텍스트 |

### Response (data)

| key                    | 타입                          | Nullable | 설명                                        |
| ---------------------- | ----------------------------- | -------- | ------------------------------------------- |
| `analysisResultId`     | `number`                      | N        | 분석 결과 ID                                |
| `previousOverallLevel` | `'HIGH' \| 'MEDIUM' \| 'LOW'` | N        | 재분석 직전 등급                            |
| `previousRedCount`     | `number`                      | N        | 재분석 직전 없음 개수                       |
| `previousYellowCount`  | `number`                      | N        | 재분석 직전 보강 필요 개수                  |
| `previousGreenCount`   | `number`                      | N        | 재분석 직전 확인됨 개수                     |
| `overallLevel`         | `'HIGH' \| 'MEDIUM' \| 'LOW'` | N        | 재분석 후 등급                              |
| `redCount`             | `number`                      | N        | 재분석 후 없음 개수                         |
| `yellowCount`          | `number`                      | N        | 재분석 후 보강 필요 개수                    |
| `greenCount`           | `number`                      | N        | 재분석 후 확인됨 개수                       |
| `lastReanalyzedAt`     | `string`                      | N        | 마지막 재분석 완료 시각 (ISO 8601)          |
| `retryCount`           | `number`                      | N        | 성공한 재분석 횟수 (최대 5)                 |
| `remainingRetryCount`  | `number`                      | N        | 남은 재분석 횟수 (0~5)                      |
| `resumeCurrentText`    | `string`                      | N        | 재분석에 사용된 이력서 텍스트               |
| `resumeLastSavedAt`    | `string`                      | N        | 이력서 편집본 저장 시각 (ISO 8601)          |
| `finalSavedAt`         | `string`                      | Y        | 최종 저장 시각 (재분석 후 null)             |
| `updatedAt`            | `string`                      | N        | 분석 결과 수정 시각 (ISO 8601)              |
| `requirements[]`       | 아래 참조                     | N        | 요건 배열 (**full 구조** — 2번 섹션과 동일) |

requirements 구조는 **2번 분석 생성의 requirements[]와 동일** (`requirementType`, `jdEvidence`, `inputOrder`, `description`, `evaluation` with `displayTitle`, `judgeReason`, `effectScore`, `effortScore`, `priorityScore`, `sortOrder` 등 전체 포함).

### 에러

| status | message                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| 400    | resumeCurrentText는 필수입니다. / 이력서 내용을 입력해주세요. / 재분석 횟수를 모두 사용했어요. |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다.                                            |
| 403    | 해당 분석 결과를 수정할 권한이 없습니다.                                                       |
| 404    | 분석 결과를 찾을 수 없습니다.                                                                  |
| 503    | 재분석에 실패했어요. 다시 시도해주세요.                                                        |

### 현재 구현과의 차이

#### 스키마 (`src/api/analysis/schema.ts`)

**`reanalyzeResponseSchema` — 대폭 변경:**

| 항목                   | 현재 코드    | v7 변경                                  |
| ---------------------- | ------------ | ---------------------------------------- |
| `previousOverallLevel` | 없음         | `overallLevelSchema` 추가 (non-nullable) |
| `previousRedCount`     | 없음         | `z.number()` 추가                        |
| `previousYellowCount`  | 없음         | `z.number()` 추가                        |
| `previousGreenCount`   | 없음         | `z.number()` 추가                        |
| `lastReanalyzedAt`     | 없음         | `z.string()` 추가                        |
| `resumeLastSavedAt`    | 없음         | `z.string()` 추가                        |
| `finalSavedAt`         | 없음         | `z.string().nullable()` 추가             |
| `updatedAt`            | `z.string()` | 유지                                     |

**`reanalysisRequirementSchema` — 폐기 → full `requirementSchema` 사용:**

| 항목                 | 현재 코드                                                                                | v7 변경                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 스키마               | `reanalysisRequirementSchema` (slim: `requirementId`, `category`, `title`, `evaluation`) | **삭제** → `requirementSchema` (full) 사용                                                     |
| `description`        | 없음                                                                                     | `z.string().nullable()` 포함                                                                   |
| `sourceText`         | 없음                                                                                     | → `jdEvidence: z.string().nullable()` 로 대체                                                  |
| `requirementType`    | 없음                                                                                     | `z.enum(['REQUIRED', 'PREFERRED'])` 포함                                                       |
| `inputOrder`         | 없음                                                                                     | `z.number()` 포함                                                                              |
| evaluation 추가 필드 | 없음                                                                                     | `displayTitle`, `judgeReason`, `effectScore`, `effortScore`, `priorityScore`, `sortOrder` 포함 |

#### 컴포넌트 (`src/app/result/[id]/_components/ResultPageClient.tsx`)

| 항목                  | 현재 코드                                                                                                              | v7 변경                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `previousCounts`      | **프론트에서 재분석 전 로컬 상태로 직접 저장** (line 60-63: `setPreviousCounts({ greenCount: data.greenCount, ... })`) | → **API 응답의 `previous*` 필드를 직접 사용**. 로컬 저장 로직 제거 가능  |
| `PreviousCounts` 타입 | `{ greenCount, yellowCount, redCount }`                                                                                | → `previousOverallLevel`도 추가 고려                                     |
| 재분석 onSuccess      | `setIsDirty(true)`만 처리                                                                                              | → `previous*` 필드를 응답에서 읽어 `SummaryCard`/`GradeChangeBar`에 전달 |

---

## 9. 만족도 저장 (PATCH /api/analyses/{analysisResultId}/satisfaction)

### 변경 요약

- Enum 값: `LIKE`, `DISLIKE`
- 선택 취소 시 문자열 `"NULL"` 대신 **JSON `null`** 전송
- 재선택 및 선택 취소 가능

### Request

`PATCH /api/analyses/{analysisResultId}/satisfaction`

| key                | 위치 | 타입                          | Nullable | 설명                      |
| ------------------ | ---- | ----------------------------- | -------- | ------------------------- |
| `analysisResultId` | Path | `number`                      | N        | 분석 결과 ID              |
| `satisfaction`     | Body | `'LIKE' \| 'DISLIKE' \| null` | Y        | 만족도 (null = 선택 취소) |

### Response (data)

| key                | 타입                  | Nullable | 설명                          |
| ------------------ | --------------------- | -------- | ----------------------------- |
| `analysisResultId` | `number`              | N        | 분석 결과 ID                  |
| `satisfaction`     | `'LIKE' \| 'DISLIKE'` | Y        | 저장된 만족도 (null = 미선택) |
| `updatedAt`        | `string`              | N        | 만족도 수정 시각 (ISO 8601)   |

### 에러

| status | message                                             |
| ------ | --------------------------------------------------- |
| 400    | satisfaction 값이 올바르지 않습니다.                |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다. |
| 403    | 해당 분석 결과에 접근할 권한이 없습니다.            |
| 404    | 분석 결과를 찾을 수 없습니다.                       |

### 현재 구현과의 차이

#### 스키마 (`src/api/analysis/schema.ts`)

| 항목                             | 현재 코드                             | v7 변경                                                                             |
| -------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `satisfactionRequestValueSchema` | `z.enum(['LIKE', 'DISLIKE', 'NULL'])` | → `z.enum(['LIKE', 'DISLIKE']).nullable()` (문자열 `'NULL'` 제거, JSON `null` 사용) |

#### 타입 (`src/api/analysis/types.ts`)

| 항목                        | 현재 코드                                                                      | v7 변경                                           |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `UpdateSatisfactionRequest` | `{ satisfaction: SatisfactionRequestValue }` (`'LIKE' \| 'DISLIKE' \| 'NULL'`) | → `{ satisfaction: 'LIKE' \| 'DISLIKE' \| null }` |

#### 컴포넌트 (`src/app/result/[id]/_components/FeedbackSection.tsx`)

| 항목      | 현재 코드                                                                               | v7 변경                                                                                  |
| --------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 선택 취소 | 미구현 — `initialSatisfaction !== null`이면 "의견이 반영되었어요!" 고정 표시, 취소 불가 | → 재선택/취소 가능 UI 필요. 이미 선택된 버튼을 다시 누르면 `{ satisfaction: null }` 전송 |
| 재선택    | 미구현 — 한번 선택하면 변경 불가                                                        | → LIKE↔DISLIKE 전환 가능 UI 필요                                                         |

---

## 10. 분석 결과 삭제 (DELETE /api/analyses/{analysisResultId})

### 변경 요약

- Soft delete 유지 (`ANALYSIS_RESULT.deleted_at` 갱신)
- 삭제된 결과는 목록, 검색, 상세 조회에서 제외 (백엔드 처리)

### Request

`DELETE /api/analyses/{analysisResultId}`

| key                | 위치 | 타입     | 설명                |
| ------------------ | ---- | -------- | ------------------- |
| `analysisResultId` | Path | `number` | 삭제할 분석 결과 ID |

Body, Query parameter 없음.

### Response (data)

| key                | 타입      | Nullable | 설명                      |
| ------------------ | --------- | -------- | ------------------------- |
| `analysisResultId` | `number`  | N        | 삭제된 분석 결과 ID       |
| `deleted`          | `boolean` | N        | 삭제 성공 여부            |
| `deletedAt`        | `string`  | N        | 삭제 처리 시각 (ISO 8601) |

### 에러

| status | message                                             |
| ------ | --------------------------------------------------- |
| 401    | 인증 정보가 유효하지 않습니다. / 만료된 토큰입니다. |
| 403    | 해당 분석 결과를 삭제할 권한이 없습니다.            |
| 404    | 분석 결과를 찾을 수 없습니다.                       |

### 현재 구현과의 차이

**변경 없음.** 현재 `deleteAnalysisResponseSchema`가 명세서와 완전히 일치합니다. 스키마, API 함수, TanStack Query 훅 모두 수정 불필요.
