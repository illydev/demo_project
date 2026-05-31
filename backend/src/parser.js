import { parse } from 'csv-parse/sync';

const DATE_KEYS = ['date', 'Date', '날짜', '일시', '시간', 'time', 'Time'];
const USER_KEYS = ['user', 'User', '화자', '이름', '닉네임', 'name', 'Name', 'sender', 'Sender'];
const MSG_KEYS = ['message', 'Message', '메시지', '내용', '대화', 'text', 'Text', 'content', 'Content'];

function pickColumn(row, candidates) {
  for (const key of candidates) {
    if (row[key] != null && String(row[key]).trim() !== '') return String(row[key]).trim();
  }
  return '';
}

function looksLikeHeader(firstRow) {
  const joined = firstRow.join(' ').toLowerCase();
  return DATE_KEYS.some(k => joined.includes(k.toLowerCase()))
    || USER_KEYS.some(k => joined.includes(k.toLowerCase()))
    || MSG_KEYS.some(k => joined.includes(k.toLowerCase()));
}

export function parseKakaoCSV(buffer) {
  const text = buffer.toString('utf-8').replace(/^﻿/, '');

  let rows;
  try {
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
  } catch (_e) {
    rows = null;
  }

  if (Array.isArray(rows) && rows.length > 0 && typeof rows[0] === 'object') {
    return rows
      .map(row => ({
        date: pickColumn(row, DATE_KEYS),
        user: pickColumn(row, USER_KEYS),
        message: pickColumn(row, MSG_KEYS),
      }))
      .filter(m => m.message);
  }

  const arrRows = parse(text, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
  if (arrRows.length === 0) return [];

  let startIdx = 0;
  if (looksLikeHeader(arrRows[0])) startIdx = 1;

  return arrRows.slice(startIdx)
    .map(cols => {
      if (cols.length >= 3) {
        return { date: cols[0], user: cols[1], message: cols.slice(2).join(',') };
      }
      if (cols.length === 2) {
        return { date: '', user: cols[0], message: cols[1] };
      }
      return { date: '', user: '', message: cols[0] || '' };
    })
    .filter(m => m.message);
}
