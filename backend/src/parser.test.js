import { describe, it, expect } from 'vitest';
import { parseKakaoCSV } from './parser.js';

const buf = (s) => Buffer.from(s, 'utf-8');

describe('parseKakaoCSV', () => {
  it('parses standard English headers', () => {
    const csv = 'Date,User,Message\n2025-01-01,alice,hello\n2025-01-02,bob,hi';
    expect(parseKakaoCSV(buf(csv))).toEqual([
      { date: '2025-01-01', user: 'alice', message: 'hello' },
      { date: '2025-01-02', user: 'bob', message: 'hi' },
    ]);
  });

  it('parses Korean headers', () => {
    const csv = '날짜,화자,메시지\n2025-01-01,영희,안녕';
    expect(parseKakaoCSV(buf(csv))).toEqual([
      { date: '2025-01-01', user: '영희', message: '안녕' },
    ]);
  });

  it('strips UTF-8 BOM from the first header', () => {
    const csv = '﻿Date,User,Message\n2025-01-01,alice,hello';
    const rows = parseKakaoCSV(buf(csv));
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2025-01-01');
  });

  it('preserves commas inside the message column', () => {
    const csv = 'Date,User,Message\n2025-01-01,alice,"hello, world, again"';
    const rows = parseKakaoCSV(buf(csv));
    expect(rows[0].message).toBe('hello, world, again');
  });

  it('drops rows with an empty message', () => {
    const csv = 'Date,User,Message\n2025-01-01,alice,hello\n2025-01-02,bob,';
    const rows = parseKakaoCSV(buf(csv));
    expect(rows).toHaveLength(1);
    expect(rows[0].user).toBe('alice');
  });

  it('returns an empty array for empty input', () => {
    expect(parseKakaoCSV(buf(''))).toEqual([]);
  });

});
