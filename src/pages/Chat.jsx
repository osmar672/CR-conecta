import { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { useData } from '../lib/useData';

export function Chat() {
  const { data: answers = [], state: chatState } = useData('/chatbot');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const conversationEnd = useRef(null);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const ask = async (value) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion || sending) return;

    const history = messages.slice(-4).flatMap(message => [
      { role: 'user', content: message.question },
      { role: 'assistant', content: message.answer }
    ]);
    setMessages(previous => [...previous, { question: cleanQuestion, answer: null }]);
    setQuestion('');
    setError('');
    setSending(true);
    try {
      const response = await api('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ question: cleanQuestion, history })
      });
      setMessages(previous => previous.map((message, index) => (
        index === previous.length - 1 && message.answer === null
          ? { ...message, answer: response.answer }
          : message
      )));
    } catch (assistantError) {
      setMessages(previous => previous.slice(0, -1));
      setError(assistantError.message || 'No se pudo obtener una respuesta del asistente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ASISTENTE IA · CR CONECTA</span>
        <h1>Orientación comunitaria</h1>
        <p>Preguntame cómo usar el sitio, sus roles o los flujos de solicitudes y donaciones. El asistente responde solo sobre CR Conecta.</p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #dce8ec', maxWidth: '750px', overflow: 'hidden' }}>
        <div aria-live="polite" aria-busy={sending} style={{ minHeight: '260px', maxHeight: '520px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#7a8e9f' }}>
              <MessageSquare size={30} />
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                {chatState === 'loading' ? 'Preparando el asistente…' : '¡Hola! Puedo orientarte sobre cómo funciona CR Conecta.'}
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${index}-${message.question}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ alignSelf: 'flex-end', background: '#06244a', color: '#ffffff', padding: '10px 16px', borderRadius: '14px 14px 2px 14px', fontSize: '12.5px', maxWidth: '85%' }}>
                  {message.question}
                </div>
                {message.answer === null
                  ? <div role="status" style={{ alignSelf: 'flex-start', color: '#64748b', padding: '10px', fontSize: '13px' }}>Estoy buscando en la información del sitio…</div>
                  : <div style={{ alignSelf: 'flex-start', background: '#eef5f8', color: '#09274c', padding: '12px 16px', borderRadius: '2px 14px 14px 14px', fontSize: '13px', maxWidth: '85%', whiteSpace: 'pre-wrap' }}>{message.answer}</div>}
              </div>
            ))
          )}
          <div ref={conversationEnd} />
        </div>

        {error && (
          <p role="alert" style={{ color: '#b91c1c', padding: '0 20px', margin: '0 0 12px', fontSize: '13px' }}>
            {error}
          </p>
        )}

        <form onSubmit={event => { event.preventDefault(); void ask(question); }} style={{ background: '#f8fafc', padding: '16px 20px', borderTop: '1px solid #edf2f5' }}>
          <label htmlFor="assistant-question" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Tu pregunta sobre CR Conecta</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="assistant-question"
              value={question}
              maxLength={1200}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ej. ¿Cómo registro una donación?"
              style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: '20px', border: '1px solid #cbd5e1' }}
              disabled={sending}
            />
            <button className="btn primary" type="submit" disabled={sending || !question.trim()}>
              {sending ? 'Consultando…' : 'Enviar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {answers.map(answer => (
              <button
                key={answer.id}
                type="button"
                disabled={sending}
                onClick={() => void ask(answer.question)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '7px 14px', fontSize: '12px', color: '#06244a', fontWeight: '600' }}
              >
                {answer.question}
              </button>
            ))}
          </div>
        </form>
      </div>
      <p style={{ maxWidth: '750px', fontSize: '12px', color: '#64748b' }}>
        La IA solo orienta sobre el prototipo. No compartas información personal o sensible; sus respuestas pueden equivocarse.
      </p>
    </div>
  );
}
