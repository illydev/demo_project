import OpenAI from 'openai';

let _client;
function getClient() {
  if (!_client) _client = new OpenAI();
  return _client;
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `당신은 채팅 커뮤니티 방장을 돕는 비서입니다.
주어진 채팅 로그를 읽고 아래 JSON 형식으로만 응답하세요.

{
  "summary": "전체 대화의 핵심 흐름을 3~5문장으로 요약",
  "actionItems": [
    { "title": "...", "priority": "high|medium|low", "reason": "왜 방장이 해야 하는지" }
  ],
  "topics": ["주요 토픽 키워드"]
}

규칙:
- actionItems는 방장 관점에서 후속 조치가 필요한 것만 (답변 필요, 갈등 중재, 공지 필요, 의사결정 필요 등).
- 잡담/일상 대화는 actionItem이 아닙니다.
- topics는 3~7개 정도 키워드.
- JSON 외 다른 텍스트 출력 금지.`;

export async function analyze(messages) {
  const chatText = messages
    .map(m => `[${m.date}] ${m.user}: ${m.message}`)
    .join('\n');

  const response = await getClient().chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `채팅 로그:\n\n${chatText}` },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '';

  try {
    return JSON.parse(raw);
  } catch (_e) {
    return {
      summary: raw,
      actionItems: [],
      topics: [],
      _parseError: true,
    };
  }
}
