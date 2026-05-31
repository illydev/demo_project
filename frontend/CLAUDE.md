# CLAUDE.md — frontend

채팅 CSV 업로드 UI. React 18 + Vite, 단일 페이지 SPA.

컴포넌트 구조·상태 모델·API 컨트랙트는 아래 import된 `architecture.md`의 "프론트엔드" / "데이터 컨트랙트" 섹션을 본다. 백엔드 API는 `../backend/`, 레포 전체 개요는 `../CLAUDE.md`.

@../architecture.md

## 명령

```bash
npm install
npm run dev                # Vite dev server (포트 5173)
npm run build              # dist/ 빌드
npm run preview            # 빌드 결과 미리보기
```

lint/test 스크립트는 없음.

## 파일 구조 (전부 `src/` 직속)

| 파일 | 역할 |
|------|------|
| `main.jsx` | `createRoot` + StrictMode 진입점 |
| `App.jsx` | 화면 전체 (드롭존, 분석 버튼, 결과 카드) |
| `api.js` | 백엔드 호출 (`/analyze`) |
| `styles.css` | 전역 스타일 |

## 환경변수

| 키 | 기본값 | 비고 |
|----|--------|------|
| `VITE_API_BASE` | `http://localhost:3001` | 배포 시 `.env.production` 또는 빌드 커맨드에서 지정 |

## 작업 시 함정

- **`_parseError` 플래그는 현재 무시한다.** 응답 스키마에 들어 있지만 UI는 분기 처리하지 않는다. 모델 응답 신뢰도 표시 같은 걸 붙일 때 이 플래그를 본다.
- **`actionItems[].priority`는 백엔드 보장 없음.** 모델이 `'high'|'medium'|'low'` 외 값을 줄 수 있어 `App.jsx`는 `item.priority || 'medium'`로 폴백한다. 새 우선순위를 받으려면 CSS 클래스(`.priority-*`)와 폴백 둘 다 손봐야 한다.
- **드롭된 파일은 MIME 체크 없음.** `accept=".csv,.txt"`는 파일 선택창 필터일 뿐, 드래그앤드롭은 임의 파일을 통과시킨다. 검증은 백엔드(5MB·파서)에 의존.
