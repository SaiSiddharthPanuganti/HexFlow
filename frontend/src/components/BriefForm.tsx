import { useState } from 'react';
import type { Workflow } from '../types/workflow.types';
import './BriefForm.css';

interface BriefFormProps {
  onWorkflowGenerated: (workflow: Workflow, brief: string) => void;
}

const EXAMPLES = [
  {
    label: 'Coffee commercial',
    prompt:
      'Create a 30-second cinematic Instagram advertisement for a premium coffee brand targeting young professionals. The ad should showcase the artisanal brewing process and emphasize the luxurious morning ritual.',
  },
  {
    label: 'Product launch',
    prompt:
      'Produce a 60-second energetic product launch video for a new tech smartwatch. Target audience: 25-40 tech enthusiasts. Key message: seamless integration with daily life.',
  },
  {
    label: 'Fashion film',
    prompt:
      'Create a 90-second luxury fashion film for an emerging designer label on YouTube. Dark, moody art direction with editorial storytelling and a sophisticated soundtrack.',
  },
];

export default function BriefForm({ onWorkflowGenerated }: BriefFormProps) {
  const [brief, setBrief] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!brief.trim()) {
      setError('Please enter a creative brief');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/workflow/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief: brief.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate workflow');
      }

      onWorkflowGenerated(data.workflow, brief.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="brief-form">
      <div className="form-card">
        <div className="form-header">
          <div className="form-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div className="form-header-text">
            <label htmlFor="brief" className="form-label">
              Describe your creative project
            </label>
            <p className="form-hint">Plain language is fine — HexFlow will structure it for you</p>
          </div>
        </div>

        <div className="examples">
          <span className="examples-label">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="example-chip"
              onClick={() => setBrief(ex.prompt)}
              disabled={isLoading}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <textarea
          id="brief"
          className="brief-textarea"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Create a 30-second cinematic Instagram advertisement for a premium coffee brand targeting young professionals. The ad should showcase the artisanal brewing process and emphasize the luxurious morning ritual..."
          rows={8}
          disabled={isLoading}
        />

        {error && (
          <div className="error-message" role="alert">
            <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !brief.trim()}
        >
          {isLoading ? (
            <>
              <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="spinner-circle" cx="12" cy="12" r="10" />
              </svg>
              <span>Generating workflow...</span>
            </>
          ) : (
            <>
              <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
              <span>Generate Workflow</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}