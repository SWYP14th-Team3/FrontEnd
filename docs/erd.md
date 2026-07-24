# ERD (Entity-Relationship Diagram)

## USER

| 컬럼        | 타입      | 설명               |
| ----------- | --------- | ------------------ |
| id          | Long (PK) | 사용자 ID          |
| email       | String    | 소셜 가입 이메일   |
| provider    | String    | `GOOGLE` / `KAKAO` |
| provider_id | String    | 소셜 고유 ID       |
| name        | String    | 사용자 이름        |
| created_at  | DateTime  | 가입일             |

## ANALYSIS_RESULT

| 컬럼                 | 타입                | 설명                              |
| -------------------- | ------------------- | --------------------------------- |
| id                   | Long (PK)           | 분석 결과 ID                      |
| user_id              | Long (FK → USER.id) | 사용자 ID                         |
| job_input_type       | String              | `URL` / `TEXT`                    |
| job_url              | String              | 공고 URL (직접 입력이면 NULL)     |
| job_platform         | String              | 채용공고 위치                     |
| job_posting_raw      | Text                | 공고 원문 텍스트                  |
| resume_original_text | Text                | 최초 PDF에서 추출한 이력서 텍스트 |
| resume_current_text  | Text                | 현재 편집 중인 이력서 텍스트      |
| company_name         | String              | 회사명                            |
| position_title       | String              | 포지션명                          |
| overall_level        | String              | `HIGH` / `MEDIUM` / `LOW`         |
| red_count            | Integer             | 없음 개수                         |
| yellow_count         | Integer             | 보강 필요 개수                    |
| green_count          | Integer             | 확인됨 개수                       |
| retry_count          | Integer             | 성공한 재분석 횟수 (최대 5)       |
| satisfaction         | String              | `LIKE` / `DISLIKE` / `NULL`       |
| created_at           | DateTime            | 생성일                            |
| updated_at           | DateTime            | 수정일                            |
| last_saved_at        | DateTime            | 최종 저장일                       |
| deleted_at           | DateTime            | 삭제일 (soft delete)              |

## JOB_REQUIREMENT

| 컬럼               | 타입                           | 설명                                            |
| ------------------ | ------------------------------ | ----------------------------------------------- |
| id                 | Long (PK)                      | 요건 ID                                         |
| analysis_result_id | Long (FK → ANALYSIS_RESULT.id) | 분석 결과 ID                                    |
| category           | String                         | `자격요건` / `업무역량` / `도메인` / `우대사항` |
| title              | String                         | 요건명                                          |
| description        | Text                           | 요건 설명                                       |
| source_text        | Text                           | 공고에서 해당 요건의 원문 근거                  |
| created_at         | DateTime                       | 생성일                                          |

## REQUIREMENT_EVALUATION

| 컬럼                | 타입                           | 설명                                          |
| ------------------- | ------------------------------ | --------------------------------------------- |
| id                  | Long (PK)                      | 평가 ID                                       |
| requirement_id      | Long (FK → JOB_REQUIREMENT.id) | 요건 ID                                       |
| match_status        | String                         | `CONFIRMED` / `NEEDS_IMPROVEMENT` / `MISSING` |
| resume_evidence     | Text                           | 이력서에서 확인된 근거                        |
| feedback            | Text                           | 상세 피드백                                   |
| revision_suggestion | Text                           | 수정 제안                                     |
| updated_at          | DateTime                       | 수정일                                        |

## 관계

```
USER ||--o{ ANALYSIS_RESULT        : "분석 결과 보유"
ANALYSIS_RESULT ||--o{ JOB_REQUIREMENT  : "공고 요건 포함"
JOB_REQUIREMENT ||--|| REQUIREMENT_EVALUATION : "요건별 최신 평가"
```
