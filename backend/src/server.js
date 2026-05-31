import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parseKakaoCSV } from './parser.js';
import { analyze } from './analyzer.js';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다. backend/.env를 확인하세요.' });
    }

    const messages = parseKakaoCSV(req.file.buffer);
    if (messages.length === 0) {
      return res.status(400).json({ error: 'CSV에서 메시지를 읽지 못했습니다. 헤더(Date, User, Message)를 확인하세요.' });
    }

    const result = await analyze(messages);

    const participants = new Set(messages.map(m => m.user).filter(Boolean));

    res.json({
      summary: result.summary || '',
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
      topics: Array.isArray(result.topics) ? result.topics : [],
      stats: {
        messageCount: messages.length,
        participantCount: participants.size,
        participants: Array.from(participants),
      },
      _parseError: result._parseError || false,
    });
  } catch (err) {
    console.error('[analyze] error:', err);
    res.status(500).json({ error: err.message || '분석 중 오류가 발생했습니다.' });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
