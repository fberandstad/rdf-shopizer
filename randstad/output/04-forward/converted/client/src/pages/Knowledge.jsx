import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';
import { api } from '../config';

export default function Knowledge() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await api('/api/knowledge/search', {
        method: 'POST', body: JSON.stringify({ question }),
      }));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-2 text-randstad-blue">
        <Sparkles size={20} />
        <h2 className="text-lg font-semibold">Ask about ShopiClaw</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Grounded in the Digital Twin (architecture, business rules, ADRs, legacy behavior) with citations.
      </p>
      <form onSubmit={ask} className="flex gap-2 mb-6">
        <input
          className="flex-1 border border-gray-200 rounded px-3 py-2 bg-white"
          placeholder="e.g. Which business rule governs cart pricing?"
          value={question} onChange={(e) => setQuestion(e.target.value)} required
        />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Asking…' : 'Ask'}</button>
      </form>

      {error && <div className="pill pill-amber">{error}</div>}
      {result && (
        <div className="card">
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
          </div>
          {result.citations?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Sources</div>
              {result.citations.map((c, i) => (
                <span key={i} className="pill pill-blue">{c.source}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
