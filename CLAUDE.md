# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

카카오톡 내보내기 CSV를 업로드하면 OpenAI가 대화 요약과 방장용 액션아이템을 JSON으로 정리해 돌려주는 프로토타입. `backend/`(Express + OpenAI API) + `frontend/`(React + Vite) 2-서비스 구조의 단일 레포.

시스템 설계·요청 흐름·데이터 컨트랙트는 아래 import된 `architecture.md`를 본다.

@architecture.md

## 하위 CLAUDE.md

서비스별 운영 가이드는 각 디렉터리에 있다.

- **`backend/CLAUDE.md`** — 백엔드 명령, 엔드포인트 표, 환경변수
- **`frontend/CLAUDE.md`** — 프론트엔드 명령, 파일 구조, 작업 시 함정

## 명령

`backend/`와 `frontend/`는 각자 `npm install` + `npm run dev` (npm workspaces 미사용). 상세 명령은 각 하위 CLAUDE.md.

빠른 부팅 순서:
```bash
# 터미널 1
cd backend && cp .env.example .env  # OPENAI_API_KEY 입력
npm install && npm run dev          # :3001

# 터미널 2
cd frontend
npm install && npm run dev          # :5173
```

lint/test 스크립트는 양쪽 모두 설정되어 있지 않다.

## 레포 전체 메모

- **루트 `.env.example`은 잔재 템플릿이다.** PostgreSQL/JWT/일반 `API_KEY`가 들어 있지만 현재 코드는 어디서도 참조하지 않는다. 실제 설정은 `backend/.env`. 새 환경변수를 추가할 때 루트 쪽을 건드리지 않도록 주의.
- **루트에 `.env.bak` 같은 백업 파일이 untracked 상태로 떠 있을 수 있다.** 실수 커밋 방지를 위해 `git add .` 대신 명시적으로 파일을 지정해 staging.
- **`sample.csv`** — 형식 디버깅용 샘플. 그대로 업로드 가능.
