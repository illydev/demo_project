# CLAUDE.md — backend (API)

채팅 로그 분석 API. Express 4 + OpenAI SDK.

시스템 설계·요청 흐름·`parser.js`/`analyzer.js` 내부 동작은 아래 import된 `architecture.md`의 "백엔드" 섹션을 본다. 프론트엔드는 `../frontend/`, 레포 전체 개요는 `../CLAUDE.md`.

@../architecture.md

## 명령

```bash
cp .env.example .env       # OPENAI_API_KEY 채우기 (필수)
npm install
npm run dev                # node --watch (파일 변경 시 자동 재시작)
npm start                  # production 실행
```

포트 기본값 3001. lint/test 스크립트 없음.

## 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET    | `/health`  | `{ ok: true }` 헬스체크 |
| POST   | `/analyze` | multipart/form-data, field name `file` — 응답 스키마는 `../architecture.md` |

## 환경변수

`.env` 키는 세 개뿐 (`.env.example` 참조):

| 키 | 기본값 | 비고 |
|----|--------|------|
| `OPENAI_API_KEY` | — | 없으면 `/analyze`가 500 (요청 진입 시점에 가드) |
| `OPENAI_MODEL`   | `gpt-4o-mini` | 모델 교체 시 여기만 |
| `PORT`           | `3001` | |

레포 루트의 `.env.example`은 PostgreSQL/JWT가 들어 있는 **사용되지 않는 잔재 템플릿**이다. 백엔드 설정과 무관하니 헷갈리지 말 것.

## 코드 만질 때 자주 찾는 위치

| 바꾸려는 것 | 파일 / 상수 |
|-------------|-------------|
| CSV 컬럼 별칭 추가 | `parser.js` 상단 `DATE_KEYS`/`USER_KEYS`/`MSG_KEYS` |
| LLM 출력 스키마·규칙 | `analyzer.js` 의 `SYSTEM_PROMPT` |
| 업로드 크기 상한 | `server.js` 의 `multer({ limits })` |
| 통계 항목 추가 | `server.js` 응답 조립부 (`participants` 집계 옆) |
