# 채팅방 분석 프로토타입

카카오톡 내보내기 CSV를 업로드하면 OpenAI API가 대화 요약과 방장이 처리할 액션아이템을 정리해주는 웹앱.

## 구조
- `frontend/` — React + Vite (포트 5173)
- `backend/` — Express + OpenAI API (포트 3001)

## 실행 방법

### 1. 백엔드
```bash
cd backend
cp .env.example .env
# .env 파일을 열어 OPENAI_API_KEY 입력
npm install
npm run dev
```

### 2. 프론트엔드 (새 터미널)
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속 후 CSV 업로드.

## CSV 형식

다음 컬럼명 중 하나면 인식한다 (대소문자/한영 혼용 가능):
- 날짜: `Date`, `날짜`, `일시`, `시간`
- 사용자: `User`, `화자`, `이름`, `닉네임`
- 메시지: `Message`, `메시지`, `내용`, `대화`

예시:
```csv
Date,User,Message
2026-01-15 10:23,홍길동,오늘 모임 장소 어디였죠?
2026-01-15 10:24,김철수,강남역 2번 출구입니다
```
