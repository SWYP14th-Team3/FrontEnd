# ResuFit — API 명세서

> **Base URL:** `/api`  
> **인증:** `Authorization: Bearer <access_token>` (🔒 표시된 API)  
> **공통 응답:** `{ status: number, message: string, data: T }`

---

## 목차

1. [인증 (Authentication)](#1-인증-authentication)
2. [분석하기 (Analysis)](#2-분석하기-analysis)
3. [이력서 편집 / 자동저장](#3-이력서-편집--자동저장)
4. [재분석 (Reanalysis)](#4-재분석-reanalysis)
5. [분석 결과 저장 / 삭제](#5-분석-결과-저장--삭제)
6. [만족도 (Satisfaction)](#6-만족도-satisfaction)
7. [공통 에러 코드](#7-공통-에러-코드)

---

## 1. 인증 (Authentication)

### POST `/auth/oauth/{provider}/login`

> 카카오/구글 OAuth 소셜 로그인

**Path Parameters**

| key        | 설명               | value 타입 | 옵션              | Nullable | 예시    |
| ---------- | ------------------ | ---------- | ----------------- | -------- | ------- |
| `provider` | 소셜 로그인 제공자 | String     | `kakao`, `google` | N        | `kakao` |

**Request Body**

| key                 | 설명                                        | value 타입 | 옵션 | Nullable | 예시           |
| ------------------- | ------------------------------------------- | ---------- | ---- | -------- | -------------- |
| `authorizationCode` | OAuth 인증 후 프론트에서 전달받은 인가 코드 | String     | -    | N        | `4/0AbUR2V...` |

**Response Body**

| key                  | 설명               | value 타입 | 옵션              | Nullable | 예시                      |
| -------------------- | ------------------ | ---------- | ----------------- | -------- | ------------------------- |
| `status`             | HTTP 상태 코드     | Number     | -                 | N        | `200`                     |
| `message`            | 응답 메시지        | String     | -                 | N        | `OK`                      |
| `data.accessToken`   | JWT Access Token   | String     | -                 | N        | `eyJhbGciOiJIUzI1NiJ9...` |
| `data.refreshToken`  | JWT Refresh Token  | String     | -                 | N        | `eyJhbGciOiJIUzI1NiJ9...` |
| `data.tokenType`     | 토큰 타입          | String     | `Bearer`          | N        | `Bearer`                  |
| `data.user.id`       | 사용자 ID          | Number     | -                 | N        | `1`                       |
| `data.user.email`    | 소셜 계정 이메일   | String     | -                 | Y        | `user@gmail.com`          |
| `data.user.name`     | 사용자 이름        | String     | -                 | Y        | `강인성`                  |
| `data.user.provider` | 소셜 로그인 제공자 | String     | `GOOGLE`, `KAKAO` | N        | `GOOGLE`                  |

**Example**

Request:

```json
POST /api/auth/oauth/google/login
Content-Type: application/json
```

```json
{
  "authorizationCode": "4/0AbUR2Vabcde..."
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "name": "강인성",
      "provider": "GOOGLE"
    }
  }
}
```

**Status**

| status | response content                              |
| ------ | --------------------------------------------- |
| `200`  | 로그인 성공                                   |
| `400`  | 잘못된 provider 값입니다.                     |
| `400`  | authorizationCode는 필수입니다.               |
| `401`  | 소셜 로그인 인증에 실패했습니다.              |
| `500`  | 소셜 로그인 처리 중 서버 오류가 발생했습니다. |

**비고**

- 로그인 성공 시 USER 생성 또는 조회
- BFF(Route Handler)에서 두 토큰 모두 httpOnly 쿠키로 변환하여 저장

---

### POST `/auth/logout` 🔒

> 로그아웃 (Refresh Token 무효화)

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |

**Request Body**

| key            | 설명                                 | value 타입 | 옵션 | Nullable | 예시                      |
| -------------- | ------------------------------------ | ---------- | ---- | -------- | ------------------------- |
| `refreshToken` | 로그인 시 발급받은 JWT Refresh Token | String     | -    | N        | `eyJhbGciOiJIUzI1NiJ9...` |

**Response Body**

| key       | 설명           | value 타입 | 옵션 | Nullable | 예시  |
| --------- | -------------- | ---------- | ---- | -------- | ----- |
| `status`  | HTTP 상태 코드 | Number     | -    | N        | `200` |
| `message` | 응답 메시지    | String     | -    | N        | `OK`  |

**Example**

Request:

```json
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": null
}
```

**Status**

| status | response content                           |
| ------ | ------------------------------------------ |
| `200`  | 로그아웃 성공                              |
| `401`  | 인증 정보가 유효하지 않습니다.             |
| `401`  | Refresh Token이 유효하지 않습니다.         |
| `500`  | 로그아웃 처리 중 서버 오류가 발생했습니다. |

---

### GET `/auth/me` 🔒

> 로그인 사용자 정보 조회

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |

**Response Body**

| key             | 설명               | value 타입 | 옵션              | Nullable | 예시             |
| --------------- | ------------------ | ---------- | ----------------- | -------- | ---------------- |
| `status`        | HTTP 상태 코드     | Number     | -                 | N        | `200`            |
| `message`       | 응답 메시지        | String     | -                 | N        | `OK`             |
| `data.id`       | 사용자 ID          | Number     | -                 | N        | `1`              |
| `data.email`    | 소셜 계정 이메일   | String     | -                 | Y        | `user@gmail.com` |
| `data.name`     | 사용자 이름        | String     | -                 | Y        | `강인성`         |
| `data.provider` | 소셜 로그인 제공자 | String     | `GOOGLE`, `KAKAO` | N        | `GOOGLE`         |

**Example**

Request:

```json
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "강인성",
    "provider": "GOOGLE"
  }
}
```

**Status**

| status | response content                              |
| ------ | --------------------------------------------- |
| `200`  | 로그인 사용자 정보 조회 성공                  |
| `401`  | 인증 정보가 유효하지 않습니다.                |
| `401`  | 만료된 토큰입니다.                            |
| `404`  | 사용자를 찾을 수 없습니다.                    |
| `500`  | 사용자 정보 조회 중 서버 오류가 발생했습니다. |

---

### POST `/auth/reissue`

> Access Token 재발급

**Request Body**

| key            | 설명                                             | value 타입 | 옵션 | Nullable | 예시                                     |
| -------------- | ------------------------------------------------ | ---------- | ---- | -------- | ---------------------------------------- |
| `refreshToken` | Access Token 재발급에 사용되는 JWT Refresh Token | String     | -    | N        | `eyJhbGciOiJIUzI1NiJ9.refresh.signature` |

**Response Body**

| key                | 설명                         | value 타입 | 옵션     | Nullable | 예시                      |
| ------------------ | ---------------------------- | ---------- | -------- | -------- | ------------------------- |
| `status`           | HTTP 상태 코드               | Number     | -        | N        | `200`                     |
| `message`          | 응답 메시지                  | String     | -        | N        | `OK`                      |
| `data.accessToken` | 새로 발급된 JWT Access Token | String     | -        | N        | `eyJhbGciOiJIUzI1NiJ9...` |
| `data.tokenType`   | 토큰 타입                    | String     | `Bearer` | N        | `Bearer`                  |

**Example**

Request:

```json
POST /api/auth/reissue
Content-Type: application/json
```

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.refresh.signature"
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.newAccess.signature",
    "tokenType": "Bearer"
  }
}
```

**Status**

| status | response content                                |
| ------ | ----------------------------------------------- |
| `200`  | Access Token 재발급 성공                        |
| `400`  | Refresh Token이 요청에 포함되지 않았습니다.     |
| `401`  | Refresh Token이 유효하지 않거나 만료되었습니다. |
| `404`  | 사용자를 찾을 수 없습니다.                      |
| `500`  | 토큰 재발급 중 서버 오류가 발생했습니다.        |

---

## 2. 분석하기 (Analysis)

### POST `/analyses` 🔒

> 이력서 + 공고 분석 생성

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |
| `Content-Type`  | 요청 데이터 형식                    | String     | `multipart/form-data`  | N        | `multipart/form-data`            |

**Request Body**

| key            | 설명                    | value 타입 | 옵션                         | Nullable | 예시                              |
| -------------- | ----------------------- | ---------- | ---------------------------- | -------- | --------------------------------- |
| `resumeFile`   | 분석할 이력서 PDF 파일  | File       | PDF, 최대 10MB               | N        | `resume.pdf`                      |
| `jobInputType` | 공고 입력 방식          | String     | `URL`, `TEXT`                | N        | `URL`                             |
| `jobUrl`       | 공고 URL                | String     | `http://`, `https://`로 시작 | Y        | `https://company.com/jobs/123`    |
| `jobText`      | 직접 입력한 공고 텍스트 | String     | 100자 이상 6000자 미만       | Y        | `백엔드 개발자 채용 공고 내용...` |

**Request Body 조건**

| 조건                  | 설명                                   |
| --------------------- | -------------------------------------- |
| `jobInputType = URL`  | `jobUrl` 필수, `jobText`는 `null` 가능 |
| `jobInputType = TEXT` | `jobText` 필수, `jobUrl`은 `null` 가능 |
| `resumeFile`          | 텍스트 기반 PDF만 가능                 |
| 이미지 기반 PDF       | MVP 미지원                             |

**Response Body**

| key                                                 | 설명                              | value 타입 | 옵션                                         | Nullable | 예시                                                                  |
| --------------------------------------------------- | --------------------------------- | ---------- | -------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `status`                                            | HTTP 상태 코드                    | Number     | -                                            | N        | `200`                                                                 |
| `message`                                           | 응답 메시지                       | String     | -                                            | N        | `OK`                                                                  |
| `data.analysisResultId`                             | 분석 결과 ID                      | Number     | -                                            | N        | `1`                                                                   |
| `data.companyName`                                  | 회사명                            | String     | -                                            | Y        | `카카오`                                                              |
| `data.positionTitle`                                | 포지션명                          | String     | -                                            | Y        | `백엔드 개발자`                                                       |
| `data.overallLevel`                                 | 전체 적합도 등급                  | String     | `HIGH`, `MEDIUM`, `LOW`                      | N        | `MEDIUM`                                                              |
| `data.redCount`                                     | 없음 개수                         | Number     | -                                            | N        | `2`                                                                   |
| `data.yellowCount`                                  | 보강 필요 개수                    | Number     | -                                            | N        | `3`                                                                   |
| `data.greenCount`                                   | 확인됨 개수                       | Number     | -                                            | N        | `5`                                                                   |
| `data.retryCount`                                   | 성공한 재분석 횟수                | Number     | 최대 5                                       | N        | `0`                                                                   |
| `data.remainingRetryCount`                          | 남은 재분석 횟수                  | Number     | 최대 5                                       | N        | `5`                                                                   |
| `data.satisfaction`                                 | 만족도                            | String     | `LIKE`, `DISLIKE`, `null`                    | Y        | `null`                                                                |
| `data.jobInputType`                                 | 공고 입력 방식                    | String     | `URL`, `TEXT`                                | N        | `URL`                                                                 |
| `data.jobUrl`                                       | 공고 URL                          | String     | -                                            | Y        | `https://company.com/jobs/123`                                        |
| `data.jobPostingRaw`                                | 공고 원문 텍스트                  | String     | -                                            | N        | `공고 원문 텍스트`                                                    |
| `data.resumeOriginalText`                           | 최초 PDF에서 추출한 이력서 텍스트 | String     | -                                            | N        | `이력서 원문 텍스트`                                                  |
| `data.resumeCurrentText`                            | 현재 편집 중인 이력서 텍스트      | String     | -                                            | N        | `현재 이력서 텍스트`                                                  |
| `data.createdAt`                                    | 분석 결과 생성일                  | String     | ISO 8601 DateTime                            | N        | `2026-07-06T21:30:00`                                                 |
| `data.updatedAt`                                    | 분석 결과 수정일                  | String     | ISO 8601 DateTime                            | N        | `2026-07-06T21:30:00`                                                 |
| `data.lastSavedAt`                                  | 최종 저장일                       | String     | ISO 8601 DateTime                            | Y        | `null`                                                                |
| `data.requirements[].requirementId`                 | 공고 요건 ID                      | Number     | -                                            | N        | `1`                                                                   |
| `data.requirements[].category`                      | 요건 카테고리                     | String     | `자격요건`, `업무역량`, `도메인`, `우대사항` | N        | `자격요건`                                                            |
| `data.requirements[].title`                         | 요건명                            | String     | -                                            | N        | `Spring Boot 개발 경험`                                               |
| `data.requirements[].description`                   | 요건 설명                         | String     | -                                            | Y        | `Spring Boot 기반 백엔드 개발 경험이 필요합니다.`                     |
| `data.requirements[].sourceText`                    | 공고에서 해당 요건의 원문 근거    | String     | -                                            | Y        | `Spring Boot 기반 백엔드 개발 경험 보유자`                            |
| `data.requirements[].evaluation.evaluationId`       | 요건 평가 ID                      | Number     | -                                            | N        | `1`                                                                   |
| `data.requirements[].evaluation.matchStatus`        | 매칭 상태                         | String     | `CONFIRMED`, `NEEDS_IMPROVEMENT`, `MISSING`  | N        | `NEEDS_IMPROVEMENT`                                                   |
| `data.requirements[].evaluation.resumeEvidence`     | 이력서에서 확인된 근거            | String     | -                                            | Y        | `Spring Boot 프로젝트 경험은 있으나 구체적인 역할 설명이 부족함`      |
| `data.requirements[].evaluation.feedback`           | 상세 피드백                       | String     | -                                            | Y        | `관련 경험은 확인되지만 표현이 구체적이지 않습니다.`                  |
| `data.requirements[].evaluation.revisionSuggestion` | 수정 제안                         | String     | -                                            | Y        | `Spring Boot로 JWT 인증 API를 구현한 경험을 구체적으로 작성해보세요.` |

**Example**

Request - URL 입력 방식:

```json
POST /api/analyses
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

```json
{
  "resumeFile": "resume.pdf",
  "jobInputType": "URL",
  "jobUrl": "https://company.com/jobs/123",
  "jobText": null
}
```

Request - 직접 입력 방식:

```json
POST /api/analyses
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
```

```json
{
  "resumeFile": "resume.pdf",
  "jobInputType": "TEXT",
  "jobUrl": null,
  "jobText": "백엔드 개발자 채용 공고 본문..."
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "companyName": "카카오",
    "positionTitle": "백엔드 개발자",
    "overallLevel": "MEDIUM",
    "redCount": 2,
    "yellowCount": 3,
    "greenCount": 5,
    "retryCount": 0,
    "remainingRetryCount": 5,
    "satisfaction": null,
    "jobInputType": "URL",
    "jobUrl": "https://company.com/jobs/123",
    "jobPostingRaw": "공고 원문 텍스트",
    "resumeOriginalText": "PDF에서 추출한 최초 이력서 텍스트",
    "resumeCurrentText": "현재 편집 중인 이력서 텍스트",
    "createdAt": "2026-07-06T21:30:00",
    "updatedAt": "2026-07-06T21:30:00",
    "lastSavedAt": null,
    "requirements": [
      {
        "requirementId": 1,
        "category": "자격요건",
        "title": "Spring Boot 개발 경험",
        "description": "Spring Boot 기반 백엔드 개발 경험이 필요합니다.",
        "sourceText": "Spring Boot 기반 백엔드 개발 경험 보유자",
        "evaluation": {
          "evaluationId": 1,
          "matchStatus": "NEEDS_IMPROVEMENT",
          "resumeEvidence": "Spring Boot 프로젝트 경험은 있으나 구체적인 역할 설명이 부족함",
          "feedback": "관련 경험은 확인되지만 어떤 기능을 구현했는지 명확하지 않습니다.",
          "revisionSuggestion": "Spring Boot로 JWT 인증 API를 구현하고 배포 환경에서 검증한 경험을 구체적으로 작성해보세요."
        }
      },
      {
        "requirementId": 2,
        "category": "우대사항",
        "title": "AWS 배포 경험",
        "description": "AWS 환경에서 서비스를 배포한 경험을 우대합니다.",
        "sourceText": "AWS, Docker 기반 배포 경험 우대",
        "evaluation": {
          "evaluationId": 2,
          "matchStatus": "CONFIRMED",
          "resumeEvidence": "AWS EC2와 Docker를 이용한 Spring Boot 서버 배포 경험 확인",
          "feedback": "공고의 우대사항과 관련된 경험이 명확히 확인됩니다.",
          "revisionSuggestion": null
        }
      }
    ]
  }
}
```

**Status**

| status | response content                         |
| ------ | ---------------------------------------- |
| `200`  | 분석 생성 성공                           |
| `400`  | PDF만 가능                               |
| `400`  | 10MB 이하만                              |
| `400`  | 올바른 URL을 입력해주세요                |
| `400`  | 공고 내용은 100자 이상 입력해주세요      |
| `400`  | 공고 내용은 6000자 미만으로 입력해주세요 |
| `401`  | 인증 정보가 유효하지 않습니다.           |
| `422`  | 텍스트를 읽을 수 없는 PDF입니다          |
| `422`  | 직접 텍스트를 붙여넣어주세요             |
| `503`  | 분석에 실패했어요. 다시 시도해주세요     |
| `500`  | 분석 생성 중 서버 오류가 발생했습니다.   |

---

### GET `/analyses/{analysisResultId}` 🔒

> 분석 결과 상세 조회

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |

**Path Parameters**

| key                | 설명                | value 타입 | 옵션 | Nullable | 예시 |
| ------------------ | ------------------- | ---------- | ---- | -------- | ---- |
| `analysisResultId` | 조회할 분석 결과 ID | Number     | -    | N        | `1`  |

**Response Body**

| key                                                 | 설명                              | value 타입 | 옵션                                         | Nullable | 예시                                              |
| --------------------------------------------------- | --------------------------------- | ---------- | -------------------------------------------- | -------- | ------------------------------------------------- |
| `status`                                            | HTTP 상태 코드                    | Number     | -                                            | N        | `200`                                             |
| `message`                                           | 응답 메시지                       | String     | -                                            | N        | `OK`                                              |
| `data.analysisResultId`                             | 분석 결과 ID                      | Number     | -                                            | N        | `1`                                               |
| `data.companyName`                                  | 회사명                            | String     | -                                            | Y        | `카카오`                                          |
| `data.positionTitle`                                | 포지션명                          | String     | -                                            | Y        | `백엔드 개발자`                                   |
| `data.overallLevel`                                 | 전체 적합도 등급                  | String     | `HIGH`, `MEDIUM`, `LOW`                      | N        | `MEDIUM`                                          |
| `data.redCount`                                     | 없음 개수                         | Number     | -                                            | N        | `2`                                               |
| `data.yellowCount`                                  | 보강 필요 개수                    | Number     | -                                            | N        | `3`                                               |
| `data.greenCount`                                   | 확인됨 개수                       | Number     | -                                            | N        | `5`                                               |
| `data.retryCount`                                   | 성공한 재분석 횟수                | Number     | 최대 5                                       | N        | `1`                                               |
| `data.remainingRetryCount`                          | 남은 재분석 횟수                  | Number     | 최대 5                                       | N        | `4`                                               |
| `data.satisfaction`                                 | 만족도                            | String     | `LIKE`, `DISLIKE`, `null`                    | Y        | `LIKE`                                            |
| `data.jobInputType`                                 | 공고 입력 방식                    | String     | `URL`, `TEXT`                                | N        | `URL`                                             |
| `data.jobUrl`                                       | 공고 URL                          | String     | -                                            | Y        | `https://company.com/jobs/123`                    |
| `data.jobPostingRaw`                                | 공고 원문 텍스트                  | String     | -                                            | N        | `공고 원문 텍스트`                                |
| `data.resumeOriginalText`                           | 최초 PDF에서 추출한 이력서 텍스트 | String     | -                                            | N        | `최초 이력서 텍스트`                              |
| `data.resumeCurrentText`                            | 현재 편집 중인 이력서 텍스트      | String     | -                                            | N        | `현재 이력서 텍스트`                              |
| `data.createdAt`                                    | 분석 결과 생성일                  | String     | ISO 8601 DateTime                            | N        | `2026-07-06T21:30:00`                             |
| `data.updatedAt`                                    | 분석 결과 수정일                  | String     | ISO 8601 DateTime                            | N        | `2026-07-06T21:45:00`                             |
| `data.lastSavedAt`                                  | 최종 저장일                       | String     | ISO 8601 DateTime                            | Y        | `2026-07-06T21:40:00`                             |
| `data.requirements[].requirementId`                 | 공고 요건 ID                      | Number     | -                                            | N        | `1`                                               |
| `data.requirements[].category`                      | 요건 카테고리                     | String     | `자격요건`, `업무역량`, `도메인`, `우대사항` | N        | `자격요건`                                        |
| `data.requirements[].title`                         | 요건명                            | String     | -                                            | N        | `Spring Boot 개발 경험`                           |
| `data.requirements[].description`                   | 요건 설명                         | String     | -                                            | Y        | `Spring Boot 기반 백엔드 개발 경험이 필요합니다.` |
| `data.requirements[].sourceText`                    | 공고에서 해당 요건의 원문 근거    | String     | -                                            | Y        | `Spring Boot 기반 백엔드 개발 경험 보유자`        |
| `data.requirements[].evaluation.evaluationId`       | 요건 평가 ID                      | Number     | -                                            | N        | `1`                                               |
| `data.requirements[].evaluation.matchStatus`        | 매칭 상태                         | String     | `CONFIRMED`, `NEEDS_IMPROVEMENT`, `MISSING`  | N        | `CONFIRMED`                                       |
| `data.requirements[].evaluation.resumeEvidence`     | 이력서에서 확인된 근거            | String     | -                                            | Y        | `Spring Boot 기반 JWT 인증 API 구현 경험 확인`    |
| `data.requirements[].evaluation.feedback`           | 상세 피드백                       | String     | -                                            | Y        | `요건과 관련된 경험이 명확히 확인됩니다.`         |
| `data.requirements[].evaluation.revisionSuggestion` | 수정 제안                         | String     | -                                            | Y        | `null`                                            |

**Example**

Request:

```json
GET /api/analyses/1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "companyName": "카카오",
    "positionTitle": "백엔드 개발자",
    "overallLevel": "MEDIUM",
    "redCount": 1,
    "yellowCount": 2,
    "greenCount": 3,
    "retryCount": 1,
    "remainingRetryCount": 4,
    "satisfaction": "LIKE",
    "jobInputType": "URL",
    "jobUrl": "https://company.com/jobs/123",
    "jobPostingRaw": "백엔드 개발자 채용 공고 원문 텍스트...",
    "resumeOriginalText": "PDF에서 최초로 추출한 이력서 텍스트...",
    "resumeCurrentText": "사용자가 현재 편집 중인 이력서 텍스트...",
    "createdAt": "2026-07-06T21:30:00",
    "updatedAt": "2026-07-06T21:45:00",
    "lastSavedAt": "2026-07-06T21:40:00",
    "requirements": [
      {
        "requirementId": 1,
        "category": "자격요건",
        "title": "Spring Boot 개발 경험",
        "description": "Spring Boot 기반 백엔드 개발 경험이 필요합니다.",
        "sourceText": "Spring Boot 기반 백엔드 개발 경험 보유자",
        "evaluation": {
          "evaluationId": 1,
          "matchStatus": "CONFIRMED",
          "resumeEvidence": "Spring Boot 기반 JWT 인증 API 구현 경험 확인",
          "feedback": "요건과 관련된 경험이 명확히 확인됩니다.",
          "revisionSuggestion": null
        }
      },
      {
        "requirementId": 2,
        "category": "업무역량",
        "title": "Docker 기반 배포 경험",
        "description": "Docker를 활용한 서비스 배포 경험이 필요합니다.",
        "sourceText": "Docker 기반 배포 경험 보유자",
        "evaluation": {
          "evaluationId": 2,
          "matchStatus": "NEEDS_IMPROVEMENT",
          "resumeEvidence": "Docker를 사용한 경험은 있으나 배포 과정과 역할 설명이 부족함",
          "feedback": "관련 경험은 확인되지만 어떤 환경에서 어떤 문제를 해결했는지 부족합니다.",
          "revisionSuggestion": "Docker로 Spring Boot 서버를 컨테이너화하고 EC2에 배포한 경험을 구체적으로 작성해보세요."
        }
      },
      {
        "requirementId": 3,
        "category": "자격요건",
        "title": "대용량 트래픽 처리 경험",
        "description": "트래픽이 많은 서비스의 성능 개선 경험이 필요합니다.",
        "sourceText": "대용량 트래픽 처리 및 성능 개선 경험",
        "evaluation": {
          "evaluationId": 3,
          "matchStatus": "MISSING",
          "resumeEvidence": null,
          "feedback": "이력서에서 해당 요건과 직접적으로 연결되는 경험을 찾기 어렵습니다.",
          "revisionSuggestion": "성능 개선, 캐싱, 쿼리 최적화, 부하 테스트 경험이 있다면 구체적으로 추가해보세요."
        }
      }
    ]
  }
}
```

**Status**

| status | response content                            |
| ------ | ------------------------------------------- |
| `200`  | 분석 결과 상세 조회 성공                    |
| `401`  | 인증 정보가 유효하지 않습니다.              |
| `401`  | 만료된 토큰입니다.                          |
| `403`  | 해당 분석 결과에 접근할 권한이 없습니다.    |
| `404`  | 분석 결과를 찾을 수 없습니다.               |
| `500`  | 분석 결과 조회 중 서버 오류가 발생했습니다. |

---

### GET `/analyses` 🔒

> 분석 결과 목록 조회 / 회사명 검색

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |

**Query Parameters**

| key           | 설명                  | value 타입 | 옵션       | Nullable | 예시     |
| ------------- | --------------------- | ---------- | ---------- | -------- | -------- |
| `page`        | 조회할 페이지 번호    | Number     | 0부터 시작 | Y        | `0`      |
| `size`        | 한 페이지당 조회 개수 | Number     | 기본값 10  | Y        | `10`     |
| `companyName` | 회사명 검색어         | String     | -          | Y        | `카카오` |

**Response Body**

| key                                  | 설명                  | value 타입 | 옵션                    | Nullable | 예시                  |
| ------------------------------------ | --------------------- | ---------- | ----------------------- | -------- | --------------------- |
| `status`                             | HTTP 상태 코드        | Number     | -                       | N        | `200`                 |
| `message`                            | 응답 메시지           | String     | -                       | N        | `OK`                  |
| `data.content[].analysisResultId`    | 분석 결과 ID          | Number     | -                       | N        | `1`                   |
| `data.content[].companyName`         | 회사명                | String     | -                       | Y        | `카카오`              |
| `data.content[].positionTitle`       | 포지션명              | String     | -                       | Y        | `백엔드 개발자`       |
| `data.content[].overallLevel`        | 전체 적합도 등급      | String     | `HIGH`, `MEDIUM`, `LOW` | N        | `MEDIUM`              |
| `data.content[].redCount`            | 없음 개수             | Number     | -                       | N        | `2`                   |
| `data.content[].yellowCount`         | 보강 필요 개수        | Number     | -                       | N        | `3`                   |
| `data.content[].greenCount`          | 확인됨 개수           | Number     | -                       | N        | `5`                   |
| `data.content[].retryCount`          | 성공한 재분석 횟수    | Number     | 최대 5                  | N        | `1`                   |
| `data.content[].remainingRetryCount` | 남은 재분석 횟수      | Number     | 최대 5                  | N        | `4`                   |
| `data.content[].createdAt`           | 분석 결과 생성일      | String     | ISO 8601 DateTime       | N        | `2026-07-06T21:30:00` |
| `data.content[].updatedAt`           | 분석 결과 수정일      | String     | ISO 8601 DateTime       | N        | `2026-07-06T21:45:00` |
| `data.content[].lastSavedAt`         | 최종 저장일           | String     | ISO 8601 DateTime       | Y        | `2026-07-06T21:40:00` |
| `data.page`                          | 현재 페이지 번호      | Number     | 0부터 시작              | N        | `0`                   |
| `data.size`                          | 한 페이지당 조회 개수 | Number     | -                       | N        | `10`                  |
| `data.totalElements`                 | 전체 분석 결과 개수   | Number     | -                       | N        | `25`                  |
| `data.totalPages`                    | 전체 페이지 수        | Number     | -                       | N        | `3`                   |
| `data.last`                          | 마지막 페이지 여부    | Boolean    | `true`, `false`         | N        | `false`               |

**Example**

Request:

```json
GET /api/analyses?page=0&size=10&companyName=카카오
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "content": [
      {
        "analysisResultId": 1,
        "companyName": "카카오",
        "positionTitle": "백엔드 개발자",
        "overallLevel": "MEDIUM",
        "redCount": 2,
        "yellowCount": 3,
        "greenCount": 5,
        "retryCount": 1,
        "remainingRetryCount": 4,
        "createdAt": "2026-07-06T21:30:00",
        "updatedAt": "2026-07-06T21:45:00",
        "lastSavedAt": "2026-07-06T21:40:00"
      },
      {
        "analysisResultId": 2,
        "companyName": "네이버",
        "positionTitle": "서버 개발자",
        "overallLevel": "HIGH",
        "redCount": 0,
        "yellowCount": 2,
        "greenCount": 8,
        "retryCount": 0,
        "remainingRetryCount": 5,
        "createdAt": "2026-07-05T18:20:00",
        "updatedAt": "2026-07-05T18:20:00",
        "lastSavedAt": null
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 2,
    "totalPages": 1,
    "last": true
  }
}
```

Empty Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "content": [],
    "page": 0,
    "size": 10,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  }
}
```

**Status**

| status | response content                                 |
| ------ | ------------------------------------------------ |
| `200`  | 분석 결과 목록 조회 성공                         |
| `400`  | 잘못된 페이지 요청입니다.                        |
| `401`  | 인증 정보가 유효하지 않습니다.                   |
| `401`  | 만료된 토큰입니다.                               |
| `500`  | 분석 결과 목록 조회 중 서버 오류가 발생했습니다. |

---

### GET `/analyses` 🔒 (회사명 검색)

> 회사명 기준 분석 결과 검색

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |

**Query Parameters**

| key           | 설명                  | value 타입 | 옵션       | Nullable | 예시     |
| ------------- | --------------------- | ---------- | ---------- | -------- | -------- |
| `companyName` | 검색할 회사명 키워드  | String     | -          | N        | `카카오` |
| `page`        | 조회할 페이지 번호    | Number     | 0부터 시작 | Y        | `0`      |
| `size`        | 한 페이지당 조회 개수 | Number     | 기본값 10  | Y        | `10`     |

**Response Body**

| key                                  | 설명                  | value 타입 | 옵션                    | Nullable | 예시                  |
| ------------------------------------ | --------------------- | ---------- | ----------------------- | -------- | --------------------- |
| `status`                             | HTTP 상태 코드        | Number     | -                       | N        | `200`                 |
| `message`                            | 응답 메시지           | String     | -                       | N        | `OK`                  |
| `data.content[].analysisResultId`    | 분석 결과 ID          | Number     | -                       | N        | `1`                   |
| `data.content[].companyName`         | 회사명                | String     | -                       | Y        | `카카오`              |
| `data.content[].positionTitle`       | 포지션명              | String     | -                       | Y        | `백엔드 개발자`       |
| `data.content[].overallLevel`        | 전체 적합도 등급      | String     | `HIGH`, `MEDIUM`, `LOW` | N        | `MEDIUM`              |
| `data.content[].redCount`            | 없음 개수             | Number     | -                       | N        | `2`                   |
| `data.content[].yellowCount`         | 보강 필요 개수        | Number     | -                       | N        | `3`                   |
| `data.content[].greenCount`          | 확인됨 개수           | Number     | -                       | N        | `5`                   |
| `data.content[].retryCount`          | 성공한 재분석 횟수    | Number     | 최대 5                  | N        | `1`                   |
| `data.content[].remainingRetryCount` | 남은 재분석 횟수      | Number     | 최대 5                  | N        | `4`                   |
| `data.content[].createdAt`           | 분석 결과 생성일      | String     | ISO 8601 DateTime       | N        | `2026-07-06T21:30:00` |
| `data.content[].updatedAt`           | 분석 결과 수정일      | String     | ISO 8601 DateTime       | N        | `2026-07-06T21:45:00` |
| `data.content[].lastSavedAt`         | 최종 저장일           | String     | ISO 8601 DateTime       | Y        | `2026-07-06T21:40:00` |
| `data.page`                          | 현재 페이지 번호      | Number     | 0부터 시작              | N        | `0`                   |
| `data.size`                          | 한 페이지당 조회 개수 | Number     | -                       | N        | `10`                  |
| `data.totalElements`                 | 검색 결과 전체 개수   | Number     | -                       | N        | `1`                   |
| `data.totalPages`                    | 전체 페이지 수        | Number     | -                       | N        | `1`                   |
| `data.last`                          | 마지막 페이지 여부    | Boolean    | `true`, `false`         | N        | `true`                |

**Example**

Request:

```json
GET /api/analyses?companyName=카카오&page=0&size=10
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "content": [
      {
        "analysisResultId": 1,
        "companyName": "카카오",
        "positionTitle": "백엔드 개발자",
        "overallLevel": "MEDIUM",
        "redCount": 2,
        "yellowCount": 3,
        "greenCount": 5,
        "retryCount": 1,
        "remainingRetryCount": 4,
        "createdAt": "2026-07-06T21:30:00",
        "updatedAt": "2026-07-06T21:45:00",
        "lastSavedAt": "2026-07-06T21:40:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
}
```

Empty Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "content": [],
    "page": 0,
    "size": 10,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  }
}
```

**Status**

| status | response content                         |
| ------ | ---------------------------------------- |
| `200`  | 회사명 검색 성공                         |
| `400`  | 검색어를 입력해주세요.                   |
| `400`  | 잘못된 페이지 요청입니다.                |
| `401`  | 인증 정보가 유효하지 않습니다.           |
| `401`  | 만료된 토큰입니다.                       |
| `500`  | 회사명 검색 중 서버 오류가 발생했습니다. |

---

## 3. 이력서 편집 / 자동저장

### PATCH `/analyses/{analysisResultId}/resume` 🔒

> 이력서 편집본 자동저장

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |
| `Content-Type`  | 요청 데이터 형식                    | String     | `application/json`     | N        | `application/json`               |

**Path Parameters**

| key                | 설명                                | value 타입 | 옵션 | Nullable | 예시 |
| ------------------ | ----------------------------------- | ---------- | ---- | -------- | ---- |
| `analysisResultId` | 이력서 편집본을 저장할 분석 결과 ID | Number     | -    | N        | `1`  |

**Request Body**

| key                 | 설명                                  | value 타입 | 옵션 | Nullable | 예시                          |
| ------------------- | ------------------------------------- | ---------- | ---- | -------- | ----------------------------- |
| `resumeCurrentText` | 사용자가 현재 편집 중인 이력서 텍스트 | String     | -    | N        | `수정된 이력서 텍스트입니다.` |

**Response Body**

| key                      | 설명                      | value 타입 | 옵션              | Nullable | 예시                          |
| ------------------------ | ------------------------- | ---------- | ----------------- | -------- | ----------------------------- |
| `status`                 | HTTP 상태 코드            | Number     | -                 | N        | `200`                         |
| `message`                | 응답 메시지               | String     | -                 | N        | `OK`                          |
| `data.analysisResultId`  | 분석 결과 ID              | Number     | -                 | N        | `1`                           |
| `data.resumeCurrentText` | 저장된 최신 이력서 텍스트 | String     | -                 | N        | `수정된 이력서 텍스트입니다.` |
| `data.updatedAt`         | 자동저장 완료 시각        | String     | ISO 8601 DateTime | N        | `2026-07-06T21:50:00`         |

**Example**

Request:

```json
PATCH /api/analyses/1/resume
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

```json
{
  "resumeCurrentText": "Spring Boot 기반 프로젝트에서 JWT 인증 API를 구현하고, AWS EC2와 Docker를 활용해 배포한 경험이 있습니다."
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "resumeCurrentText": "Spring Boot 기반 프로젝트에서 JWT 인증 API를 구현하고, AWS EC2와 Docker를 활용해 배포한 경험이 있습니다.",
    "updatedAt": "2026-07-06T21:50:00"
  }
}
```

**Status**

| status | response content                             |
| ------ | -------------------------------------------- |
| `200`  | 이력서 편집본 자동저장 성공                  |
| `400`  | resumeCurrentText는 필수입니다.              |
| `401`  | 인증 정보가 유효하지 않거나 만료되었습니다.  |
| `403`  | 해당 분석 결과를 수정할 권한이 없습니다.     |
| `404`  | 분석 결과를 찾을 수 없습니다.                |
| `500`  | 이력서 자동저장 중 서버 오류가 발생했습니다. |

**비고**

- 프론트에서 debounce 처리 후 호출
- 자동저장은 이력서 편집본만 저장하며, 최종 저장과는 별개

---

## 4. 재분석 (Reanalysis)

### POST `/analyses/{analysisResultId}/reanalyze` 🔒

> 이력서 재분석

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |
| `Content-Type`  | 요청 데이터 형식                    | String     | `application/json`     | N        | `application/json`               |

**Path Parameters**

| key                | 설명                  | value 타입 | 옵션 | Nullable | 예시 |
| ------------------ | --------------------- | ---------- | ---- | -------- | ---- |
| `analysisResultId` | 재분석할 분석 결과 ID | Number     | -    | N        | `1`  |

**Request Body**

| key                 | 설명                        | value 타입 | 옵션 | Nullable | 예시                          |
| ------------------- | --------------------------- | ---------- | ---- | -------- | ----------------------------- |
| `resumeCurrentText` | 재분석할 최신 이력서 텍스트 | String     | -    | N        | `수정된 이력서 텍스트입니다.` |

**Response Body**

| key                                                 | 설명                               | value 타입 | 옵션                                         | Nullable | 예시                                           |
| --------------------------------------------------- | ---------------------------------- | ---------- | -------------------------------------------- | -------- | ---------------------------------------------- |
| `status`                                            | HTTP 상태 코드                     | Number     | -                                            | N        | `200`                                          |
| `message`                                           | 응답 메시지                        | String     | -                                            | N        | `OK`                                           |
| `data.analysisResultId`                             | 분석 결과 ID                       | Number     | -                                            | N        | `1`                                            |
| `data.overallLevel`                                 | 재분석 후 전체 적합도 등급         | String     | `HIGH`, `MEDIUM`, `LOW`                      | N        | `HIGH`                                         |
| `data.redCount`                                     | 재분석 후 없음 개수                | Number     | -                                            | N        | `0`                                            |
| `data.yellowCount`                                  | 재분석 후 보강 필요 개수           | Number     | -                                            | N        | `2`                                            |
| `data.greenCount`                                   | 재분석 후 확인됨 개수              | Number     | -                                            | N        | `8`                                            |
| `data.retryCount`                                   | 성공한 재분석 횟수                 | Number     | 최대 5                                       | N        | `2`                                            |
| `data.remainingRetryCount`                          | 남은 재분석 횟수                   | Number     | 최대 5                                       | N        | `3`                                            |
| `data.resumeCurrentText`                            | 재분석에 사용된 최신 이력서 텍스트 | String     | -                                            | N        | `수정된 이력서 텍스트입니다.`                  |
| `data.updatedAt`                                    | 재분석 결과 수정일                 | String     | ISO 8601 DateTime                            | N        | `2026-07-06T22:00:00`                          |
| `data.requirements[].requirementId`                 | 공고 요건 ID                       | Number     | -                                            | N        | `1`                                            |
| `data.requirements[].category`                      | 요건 카테고리                      | String     | `자격요건`, `업무역량`, `도메인`, `우대사항` | N        | `자격요건`                                     |
| `data.requirements[].title`                         | 요건명                             | String     | -                                            | N        | `Spring Boot 개발 경험`                        |
| `data.requirements[].evaluation.evaluationId`       | 요건 평가 ID                       | Number     | -                                            | N        | `1`                                            |
| `data.requirements[].evaluation.matchStatus`        | 재분석 후 매칭 상태                | String     | `CONFIRMED`, `NEEDS_IMPROVEMENT`, `MISSING`  | N        | `CONFIRMED`                                    |
| `data.requirements[].evaluation.resumeEvidence`     | 이력서에서 확인된 근거             | String     | -                                            | Y        | `Spring Boot 기반 JWT 인증 API 구현 경험 확인` |
| `data.requirements[].evaluation.feedback`           | 상세 피드백                        | String     | -                                            | Y        | `요건과 관련된 경험이 명확히 확인됩니다.`      |
| `data.requirements[].evaluation.revisionSuggestion` | 수정 제안                          | String     | -                                            | Y        | `null`                                         |

**Example**

Request:

```json
POST /api/analyses/1/reanalyze
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

```json
{
  "resumeCurrentText": "Spring Boot 기반 프로젝트에서 JWT 인증 API를 구현하고, AWS EC2와 Docker를 활용해 배포한 경험이 있습니다."
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "overallLevel": "HIGH",
    "redCount": 0,
    "yellowCount": 2,
    "greenCount": 8,
    "retryCount": 2,
    "remainingRetryCount": 3,
    "resumeCurrentText": "Spring Boot 기반 프로젝트에서 JWT 인증 API를 구현하고, AWS EC2와 Docker를 활용해 배포한 경험이 있습니다.",
    "updatedAt": "2026-07-06T22:00:00",
    "requirements": [
      {
        "requirementId": 1,
        "category": "자격요건",
        "title": "Spring Boot 개발 경험",
        "evaluation": {
          "evaluationId": 1,
          "matchStatus": "CONFIRMED",
          "resumeEvidence": "Spring Boot 기반 JWT 인증 API 구현 경험 확인",
          "feedback": "요건과 관련된 경험이 명확히 확인됩니다.",
          "revisionSuggestion": null
        }
      },
      {
        "requirementId": 2,
        "category": "업무역량",
        "title": "Docker 기반 배포 경험",
        "evaluation": {
          "evaluationId": 2,
          "matchStatus": "CONFIRMED",
          "resumeEvidence": "AWS EC2와 Docker를 활용한 배포 경험 확인",
          "feedback": "공고 요건과 관련된 배포 경험이 확인됩니다.",
          "revisionSuggestion": null
        }
      }
    ]
  }
}
```

**Status**

| status | response content                           |
| ------ | ------------------------------------------ |
| `200`  | 이력서 재분석 성공                         |
| `400`  | resumeCurrentText는 필수입니다.            |
| `400`  | 이력서 내용을 입력해주세요.                |
| `400`  | 재분석 횟수를 모두 사용했어요              |
| `401`  | 인증 정보가 유효하지 않습니다.             |
| `401`  | 만료된 토큰입니다.                         |
| `403`  | 해당 분석 결과를 수정할 권한이 없습니다.   |
| `404`  | 분석 결과를 찾을 수 없습니다.              |
| `503`  | 재분석에 실패했어요. 다시 시도해주세요     |
| `500`  | 이력서 재분석 중 서버 오류가 발생했습니다. |

**비고**

- 공고 요건(JOB_REQUIREMENT)은 기존 것을 그대로 사용
- 이력서 매칭 평가(REQUIREMENT_EVALUATION)만 재수행
- requirements에 `description`, `sourceText`는 포함되지 않음 (요건은 변경 없으므로)
- 분석 결과 1건당 **최대 5회**까지 가능

---

## 5. 분석 결과 저장 / 삭제

### PATCH `/analyses/{analysisResultId}/save` 🔒

> 분석 결과 최종 저장

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |
| `Content-Type`  | 요청 데이터 형식                    | String     | `application/json`     | N        | `application/json`               |

**Path Parameters**

| key                | 설명                     | value 타입 | 옵션 | Nullable | 예시 |
| ------------------ | ------------------------ | ---------- | ---- | -------- | ---- |
| `analysisResultId` | 최종 저장할 분석 결과 ID | Number     | -    | N        | `1`  |

**Request Body**

| key                 | 설명                             | value 타입 | 옵션 | Nullable | 예시                               |
| ------------------- | -------------------------------- | ---------- | ---- | -------- | ---------------------------------- |
| `resumeCurrentText` | 최종 저장할 이력서 편집본 텍스트 | String     | -    | N        | `최종 저장할 이력서 텍스트입니다.` |

**Response Body**

| key                      | 설명                      | value 타입 | 옵션              | Nullable | 예시                               |
| ------------------------ | ------------------------- | ---------- | ----------------- | -------- | ---------------------------------- |
| `status`                 | HTTP 상태 코드            | Number     | -                 | N        | `200`                              |
| `message`                | 응답 메시지               | String     | -                 | N        | `OK`                               |
| `data.analysisResultId`  | 분석 결과 ID              | Number     | -                 | N        | `1`                                |
| `data.saved`             | 최종 저장 성공 여부       | Boolean    | `true`, `false`   | N        | `true`                             |
| `data.resumeCurrentText` | 최종 저장된 이력서 텍스트 | String     | -                 | N        | `최종 저장할 이력서 텍스트입니다.` |
| `data.lastSavedAt`       | 최종 저장 시각            | String     | ISO 8601 DateTime | N        | `2026-07-06T22:05:00`              |
| `data.updatedAt`         | 분석 결과 수정 시각       | String     | ISO 8601 DateTime | N        | `2026-07-06T22:05:00`              |

**Example**

Request:

```json
PATCH /api/analyses/1/save
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

```json
{
  "resumeCurrentText": "Spring Boot 기반 프로젝트에서 JWT 인증 API를 구현하고, AWS EC2와 Docker를 활용해 배포한 경험이 있습니다."
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "saved": true,
    "resumeCurrentText": "Spring Boot 기반 프로젝트에서 JWT 인증 API를 구현하고, AWS EC2와 Docker를 활용해 배포한 경험이 있습니다.",
    "lastSavedAt": "2026-07-06T22:05:00",
    "updatedAt": "2026-07-06T22:05:00"
  }
}
```

**Status**

| status | response content                            |
| ------ | ------------------------------------------- |
| `200`  | 분석 결과 최종 저장 성공                    |
| `400`  | resumeCurrentText는 필수입니다.             |
| `400`  | 이력서 내용을 입력해주세요.                 |
| `401`  | 인증 정보가 유효하지 않습니다.              |
| `401`  | 만료된 토큰입니다.                          |
| `403`  | 해당 분석 결과를 저장할 권한이 없습니다.    |
| `404`  | 분석 결과를 찾을 수 없습니다.               |
| `500`  | 분석 결과 저장 중 서버 오류가 발생했습니다. |

**비고**

- 버전 관리 없이 최종 저장본 1개만 유지
- 사용자가 저장하기 버튼을 눌렀을 때 사용 (자동저장과 별개)

---

### DELETE `/analyses/{analysisResultId}` 🔒

> 분석 결과 삭제

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |

**Path Parameters**

| key                | 설명                | value 타입 | 옵션 | Nullable | 예시 |
| ------------------ | ------------------- | ---------- | ---- | -------- | ---- |
| `analysisResultId` | 삭제할 분석 결과 ID | Number     | -    | N        | `1`  |

**Response Body**

| key                     | 설명                | value 타입 | 옵션              | Nullable | 예시                  |
| ----------------------- | ------------------- | ---------- | ----------------- | -------- | --------------------- |
| `status`                | HTTP 상태 코드      | Number     | -                 | N        | `200`                 |
| `message`               | 응답 메시지         | String     | -                 | N        | `OK`                  |
| `data.analysisResultId` | 삭제된 분석 결과 ID | Number     | -                 | N        | `1`                   |
| `data.deleted`          | 삭제 성공 여부      | Boolean    | `true`, `false`   | N        | `true`                |
| `data.deletedAt`        | 삭제 처리 시각      | String     | ISO 8601 DateTime | N        | `2026-07-06T22:10:00` |

**Example**

Request:

```json
DELETE /api/analyses/1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "deleted": true,
    "deletedAt": "2026-07-06T22:10:00"
  }
}
```

**Status**

| status | response content                            |
| ------ | ------------------------------------------- |
| `200`  | 분석 결과 삭제 성공                         |
| `401`  | 인증 정보가 유효하지 않습니다.              |
| `401`  | 만료된 토큰입니다.                          |
| `403`  | 해당 분석 결과를 삭제할 권한이 없습니다.    |
| `404`  | 분석 결과를 찾을 수 없습니다.               |
| `500`  | 분석 결과 삭제 중 서버 오류가 발생했습니다. |

**비고**

- soft delete 방식 (`deleted_at` 갱신)
- 삭제된 결과는 목록/검색에서 제외

---

## 6. 만족도 (Satisfaction)

### PATCH `/analyses/{analysisResultId}/satisfaction` 🔒

> 분석 만족도 저장

**Request Header**

| key             | 설명                                | value 타입 | 옵션                   | Nullable | 예시                             |
| --------------- | ----------------------------------- | ---------- | ---------------------- | -------- | -------------------------------- |
| `Authorization` | 로그인 시 발급받은 JWT Access Token | String     | `Bearer {accessToken}` | N        | `Bearer eyJhbGciOiJIUzI1NiJ9...` |
| `Content-Type`  | 요청 데이터 형식                    | String     | `application/json`     | N        | `application/json`               |

**Path Parameters**

| key                | 설명                         | value 타입 | 옵션 | Nullable | 예시 |
| ------------------ | ---------------------------- | ---------- | ---- | -------- | ---- |
| `analysisResultId` | 만족도를 저장할 분석 결과 ID | Number     | -    | N        | `1`  |

**Request Body**

| key            | 설명        | value 타입 | 옵션                      | Nullable | 예시   |
| -------------- | ----------- | ---------- | ------------------------- | -------- | ------ |
| `satisfaction` | 분석 만족도 | String     | `LIKE`, `DISLIKE`, `NULL` | N        | `LIKE` |

**Response Body**

| key                     | 설명             | value 타입 | 옵션                      | Nullable | 예시                  |
| ----------------------- | ---------------- | ---------- | ------------------------- | -------- | --------------------- |
| `status`                | HTTP 상태 코드   | Number     | -                         | N        | `200`                 |
| `message`               | 응답 메시지      | String     | -                         | N        | `OK`                  |
| `data.analysisResultId` | 분석 결과 ID     | Number     | -                         | N        | `1`                   |
| `data.satisfaction`     | 저장된 만족도    | String     | `LIKE`, `DISLIKE`, `NULL` | Y        | `LIKE`                |
| `data.updatedAt`        | 만족도 수정 시각 | String     | ISO 8601 DateTime         | N        | `2026-07-06T22:15:00` |

**Example**

Request - 👍 선택:

```json
PATCH /api/analyses/1/satisfaction
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

```json
{
  "satisfaction": "LIKE"
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "satisfaction": "LIKE",
    "updatedAt": "2026-07-06T22:15:00"
  }
}
```

---

Request - 👎 선택:

```json
{
  "satisfaction": "DISLIKE"
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "satisfaction": "DISLIKE",
    "updatedAt": "2026-07-06T22:16:00"
  }
}
```

---

Request - 선택 취소:

```json
{
  "satisfaction": "NULL"
}
```

Response:

```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "analysisResultId": 1,
    "satisfaction": null,
    "updatedAt": "2026-07-06T22:17:00"
  }
}
```

**Status**

| status | response content                              |
| ------ | --------------------------------------------- |
| `200`  | 분석 만족도 저장 성공                         |
| `400`  | satisfaction 값이 올바르지 않습니다.          |
| `401`  | 인증 정보가 유효하지 않습니다.                |
| `401`  | 만료된 토큰입니다.                            |
| `403`  | 해당 분석 결과에 접근할 권한이 없습니다.      |
| `404`  | 분석 결과를 찾을 수 없습니다.                 |
| `500`  | 분석 만족도 저장 중 서버 오류가 발생했습니다. |

**비고**

- 분석 결과 화면 하단의 만족도 버튼 클릭 시 사용
- 이미 선택한 만족도를 다시 변경 가능
- 선택 취소 시 문자열 `"NULL"`을 보내면 응답에서는 `null`로 반환

---

## 7. 공통 에러 코드 ⚠️

| HTTP 코드 | 설명                           |
| --------- | ------------------------------ |
| `400`     | 잘못된 요청 (입력값 검증 실패) |
| `401`     | 인증 토큰 없음 또는 만료       |
| `403`     | 권한 없음                      |
| `404`     | 리소스 없음                    |
| `500`     | 서버 내부 오류                 |

**에러 응답 형식**

```json
{
  "status": 400,
  "message": "잘못된 요청입니다.",
  "data": null
}
```
