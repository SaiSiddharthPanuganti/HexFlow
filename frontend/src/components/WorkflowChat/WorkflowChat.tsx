import { useState } from 'react';
import './WorkflowChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface EditResult {
  summary: string;
  nodeLabels: string[];
}

interface WorkflowChatProps {
  onEdit: (instruction: string) => Promise<EditResult>;
}

const EXAMPLE_PROMPTS = [
  'Make the concept more cinematic and emphasize close-ups in the shot list',
  'Tighten the script to 20 seconds',
  'Shift the overall tone to premium and luxurious',
];

export default function WorkflowChat({ onEdit }: WorkflowChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const formatAssistant = (result: EditResult): string => {
    if (result.nodeLabels.length === 0) {
      return `${result.summary}\n\nNo workflow stages changed.`;
    }
    return `${result.summary}\n\nUpdated stages: ${result.nodeLabels.join(', ')}.`;
  };

  const send = async () => {
    const instruction = input.trim();
    if (!instruction || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: instruction }]);
    setInput('');
    setLoading(true);

    try {
      const result = await onEdit(instruction);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: formatAssistant(result) },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Something went wrong: ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <section className="workflow-chat" aria-label="Chat with your workflow">
      <header className="chat-header">
        <div className="chat-title">
          <span className="chat-icon-badge">
            <svg className="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7.75 5.25h8.5a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-4.25L9 17v-4.25H7.75a1 1 0 0 1-1-1v-5.5a1 1 0 0 1 1-1Z" />
              <path d="M12 8.5h.01M15.25 8.5h.01M8.75 8.5h.01" />
            </svg>
          </span>
          <div className="chat-title-text">
            <span className="chat-title-label">Chat with your workflow</span>
            <span className="chat-title-badge">Agent</span>
          </div>
        </div>
        {messages.length > 0 && (
          <span className="chat-reset" onClick={() => setMessages([])} role="button" tabIndex={0}>
            Clear
          </span>
        )}
      </header>

      {messages.length === 0 ? (
        <div className="chat-empty">
          <p className="chat-empty-text">
            Ask the agent to change a part of the workflow — it updates only the affected nodes.
            The draft on the canvas is sent as context, so your saved edits are respected.
          </p>
          <div className="chat-examples">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                className="chat-chip"
                onClick={() => setInput(ex)}
                disabled={loading}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-thread">
          {messages.map((m, i) => (
            <div
              key={i}
              className={'chat-message' + (m.role === 'user' ? ' is-user' : ' is-assistant')}
            >
              <div className="chat-bubble">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message is-assistant">
              <div className="chat-bubble chat-bubble-pending">
                <span className="chat-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                Reading your workflow…
              </div>
            </div>
          )}
        </div>
      )}

      <div className="chat-composer">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='e.g. "Make the concept more cinematic and change the shot list to emphasize close-ups."'
          rows={2}
          disabled={loading}
          aria-label="Instruction for the workflow agent"
        />
        <button
          type="button"
          className="btn btn-agent chat-send"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <>
              <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="spinner-circle" cx="12" cy="12" r="10" />
              </svg>
              <span>Applying…</span>
            </>
          ) : (
            <>
              <svg className="chat-send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>Apply</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}