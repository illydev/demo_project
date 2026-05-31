import { useRef, useState } from 'react';
import { analyzeChat } from './api.js';

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeChat(file);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="container">
      <header>
        <h1>채팅방 분석기</h1>
        <p className="subtitle">카카오톡 내보내기 CSV를 올리면 요약과 액션아이템을 정리해드려요.</p>
      </header>

      <section
        className={`dropzone ${dragOver ? 'drag' : ''} ${file ? 'has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {file ? (
          <div>
            <div className="file-name">{file.name}</div>
            <div className="file-meta">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
        ) : (
          <div>
            <div className="drop-title">CSV 파일을 끌어다 놓거나 클릭해서 선택</div>
            <div className="drop-sub">.csv 또는 .txt · 최대 5MB</div>
          </div>
        )}
      </section>

      <button className="primary" onClick={handleSubmit} disabled={!file || loading}>
        {loading ? '분석 중…' : '분석하기'}
      </button>

      {error && <div className="error">⚠ {error}</div>}

      {result && (
        <section className="results">
          <div className="stats">
            <span>메시지 {result.stats.messageCount}개</span>
            <span>참여자 {result.stats.participantCount}명</span>
          </div>

          <div className="card">
            <h2>요약</h2>
            <p>{result.summary}</p>
          </div>

          <div className="card">
            <h2>액션아이템 ({result.actionItems.length})</h2>
            {result.actionItems.length === 0 ? (
              <p className="muted">방장이 따로 처리할 사항은 없어 보여요.</p>
            ) : (
              <ul className="action-list">
                {result.actionItems.map((item, idx) => (
                  <li key={idx} className={`action priority-${item.priority || 'medium'}`}>
                    <div className="action-title">
                      <span className="badge">{item.priority || 'medium'}</span>
                      {item.title}
                    </div>
                    {item.reason && <div className="action-reason">{item.reason}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {result.topics?.length > 0 && (
            <div className="card">
              <h2>주요 토픽</h2>
              <div className="topics">
                {result.topics.map((t, i) => <span key={i} className="tag">{t}</span>)}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
