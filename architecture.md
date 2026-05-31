# Architecture

채팅 로그 분석 프로토타입의 시스템 설계. 운영/명령어/환경변수는 각 디렉터리의 `CLAUDE.md` 참조.

## 시스템 한눈에 보기

2-서비스 단일 레포. 프론트엔드가 CSV를 백엔드로 올리고, 백엔드가 OpenAI를 거쳐 구조화된 JSON을 돌려준다.

```
┌──────────────────────┐   multipart/form-data    ┌──────────────────────────┐
│  frontend (Vite)     │  ─ POST /analyze ─────►  │  backend (Express)       │
│  React SPA :5173     │                          │  :3001                   │
│  - App.jsx           │  ◄─ JSON ──────────────  │  - server.js (라우터)    │
│  - api.js            │                          │  - parser.js (CSV)       │
└──────────────────────┘                          │  - analyzer.js (OpenAI)  │
                                                  └────────────┬─────────────┘
                                                               │
                                                               ▼
                                                   ┌──────────────────────┐
                                                   │  OpenAI Chat API     │
                                                   │  (JSON object mode)  │
                                                   └──────────────────────┘
```

## 요청 흐름 (`/analyze`)

```
1. App.jsx           : FormData(file) 생성 → api.js
2. api.js            : POST {API_BASE}/analyze
3. server.js         : multer가 메모리에 5MB 제한으로 수신, OPENAI_API_KEY 가드
4. parser.js         : CSV buffer → [{date, user, message}]
5. analyzer.js       : 메시지 join → OpenAI chat.completions (JSON 모드)
6. server.js         : participants 집계 + analyzer 결과 합쳐 응답 조립
7. App.jsx           : summary / actionItems / topics / stats 카드로 렌더
```

## 백엔드

### `server.js` — 단일 라우터

- 엔드포인트는 `GET /health`와 `POST /analyze` 둘뿐.
- `multer.memoryStorage()` + `fileSize: 5MB` — 업로드 파일은 디스크에 절대 닿지 않는다. 임시 파일 청소 불필요.
- `OPENAI_API_KEY` 누락은 모듈 로드가 아니라 **요청 진입 시점**에 체크 → 500 + 한글 메시지로 떨군다 (`analyzer.js`의 lazy 싱글톤과 짝을 이루는 설계).
- 응답 조립 시 메시지 배열에서 `participants` set을 자체적으로 만든다 (LLM에 의존하지 않음 — 결정론적 통계).

### `parser.js` — 유연한 헤더 매핑 + 폴백 파싱

- 컬럼명은 한/영 다중 별칭 (`DATE_KEYS`/`USER_KEYS`/`MSG_KEYS` 상수 리스트). 새 별칭 추가하려면 이 세 상수만 손본다.
- **2단 파싱 전략**:
  1. `columns: true` 모드로 객체 파싱 시도 (헤더 있는 CSV).
  2. parse error(throw)가 발생하면 `columns: false` 배열 모드로 폴백 + 첫 행이 헤더처럼 보이면 스킵.
- **헤더가 전혀 없는 CSV는 현재 지원하지 않는다.** `columns: true`는 첫 행을 헤더로 잡아 throw하지 않고, 별칭(`DATE_KEYS` 등)과 매칭되지 않아 모든 필드가 빈 문자열이 되며 `.filter(m => m.message)`에서 떨려 결과는 `[]`이 된다 (사용자에게는 "메시지를 읽지 못했습니다" 에러).
- 3컬럼 미만 행도 베스트-에포트로 추출. `message`가 비어 있는 행만 떨군다.
- BOM(`﻿`) 제거를 명시적으로 처리 (Windows에서 만든 CSV 대응).

### `analyzer.js` — OpenAI 어댑터

- **시스템 프롬프트는 파일 상수**(`SYSTEM_PROMPT`). 출력 스키마, "방장 관점만 추출", "잡담 제외" 같은 규칙을 바꾸려면 여기.
- `response_format: { type: 'json_object' }`로 JSON 강제.
- **JSON 파싱 실패 폴백**: 모델이 비-JSON을 뱉으면 raw 텍스트를 `summary`에 담고 `_parseError: true` 플래그를 세움 → 프론트가 분기 처리 가능하도록 의도적으로 노출.
- **OpenAI 클라이언트는 lazy 싱글톤** (`getClient()`). 모듈 import 시점이 아니라 첫 호출 시 인스턴스화 → API 키 없이도 모듈 로드는 성공 → 테스트/CI 환경에서 부담 없음.
- 모델은 `OPENAI_MODEL` 환경변수, 기본 `gpt-4o-mini`.

## 프론트엔드

### 컴포넌트/상태

- **단일 컴포넌트 `App.jsx`** + 상태 5개(`file/loading/result/error/dragOver`) + ref 1개(`inputRef`). 라우팅·상태관리·UI 라이브러리 없음. 의존성은 `react`/`react-dom`만.
- 드롭존은 hidden `<input type="file">` + 클릭/드래그 위임. dropzone div 클릭 시 `inputRef.current.click()`.

### API 레이어 (`api.js`)

- API 베이스는 빌드 시점 주입 (`VITE_API_BASE`, 기본 `http://localhost:3001`).
- 에러 규약: `res.ok === false`이면 응답 body의 `error` 필드를 throw → `App.jsx`가 그대로 표시. 백엔드가 한글 메시지를 보내므로 별도 번역 불필요.

## 데이터 컨트랙트

### 입력 (CSV)

다음 컬럼명 중 하나면 인식 (대소문자/한영 혼용 가능):
- 날짜: `Date`, `날짜`, `일시`, `시간`, `time`, `Time`
- 사용자: `User`, `화자`, `이름`, `닉네임`, `name`, `Name`, `sender`, `Sender`
- 메시지: `Message`, `메시지`, `내용`, `대화`, `text`, `Text`, `content`, `Content`

### 출력 (응답 스키마)

```ts
{
  summary: string;
  actionItems: { title: string; priority: 'high'|'medium'|'low'; reason?: string }[];
  topics: string[];
  stats: { messageCount: number; participantCount: number; participants: string[] };
  _parseError?: boolean;   // OpenAI 응답이 JSON이 아니었음을 신호
}
```

- `priority`는 모델이 다른 값을 줄 수 있어 프론트가 `'medium'`으로 폴백한다. CSS 클래스(`.priority-high|medium|low`)도 이 셋만 정의됨.
- `participants`는 LLM이 아니라 백엔드의 결정론적 집계 결과.

## 핵심 설계 결정

| 결정 | 이유 |
|------|------|
| 인메모리 업로드 (디스크 X) | 5MB 상한이라 메모리로 충분, 임시 파일 청소·권한 이슈 회피 |
| 통계는 백엔드 자체 집계, LLM은 요약/액션아이템만 | 메시지 수·참여자 수는 결정론적이어야 함 |
| JSON 강제 + `_parseError` 폴백 | 응답 신뢰성을 깨지 않으면서 모델 변동성에 견고 |
| Lazy OpenAI 싱글톤 | 키 없이도 import 가능 → 테스트/도구 친화적 |
| 단일 `App.jsx` 유지 | 프로토타입 단계에서 분할은 과설계 |
