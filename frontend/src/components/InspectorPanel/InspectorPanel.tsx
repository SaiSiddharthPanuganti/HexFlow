import { useEffect, useState } from 'react';
import type { WorkflowNode } from '../../types/workflow.types';
import { getNodeStyle, getNodeIcon, getNodeLabel, getNodeStep } from '../WorkflowCanvas/nodeStyles';
import './InspectorPanel.css';

interface InspectorPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, title: string, content: string) => void;
  onRegenerate: (nodeId: string) => Promise<WorkflowNode>;
}

interface FieldErrors {
  title?: string;
  content?: string;
}

export default function InspectorPanel({ node, onClose, onSave, onRegenerate }: InspectorPanelProps) {
  const [title, setTitle] = useState(node?.title ?? '');
  const [content, setContent] = useState(node?.content ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const isDirty = node ? title !== node.title || content !== node.content : false;

  const requestClose = () => {
    if (isDirty) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  // Close on Escape, respecting unsaved changes.
  useEffect(() => {
    if (!node) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (title !== node.title || content !== node.content) {
        setConfirmingDiscard(true);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [node, title, content, onClose]);

  const discardChanges = () => {
    setConfirmingDiscard(false);
    onClose();
  };

  const handleSave = () => {
    if (!node) return;

    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!content.trim()) nextErrors.content = 'Content is required.';
    setErrors(nextErrors);

    if (nextErrors.title || nextErrors.content) return;

    onSave(node.id, title.trim(), content.trim());
  };

  const handleRegenerate = async () => {
    if (!node || regenerating || isDirty) return;

    setRegenerating(true);
    setRegenerateError(null);
    try {
      const updated = await onRegenerate(node.id);
      setTitle(updated.title);
      setContent(updated.content);
    } catch (err) {
      setRegenerateError(
        err instanceof Error ? err.message : 'Failed to regenerate node',
      );
    } finally {
      setRegenerating(false);
    }
  };

  if (!node) {
    return (
      <aside className="inspector-panel inspector-empty" aria-label="Node inspector">
        <div className="empty-content">
          <div className="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 15-9-9-9 9" />
              <path d="M5 20h14" />
              <path d="m6.5 10.5 5-5 5 5" />
            </svg>
          </div>
          <p className="empty-title">No node selected</p>
          <p className="empty-hint">Click any node in the workflow to inspect and edit its details.</p>
        </div>
      </aside>
    );
  }

  const style = getNodeStyle(node.type);
  const icon = getNodeIcon(node.type);

  return (
    <aside className="inspector-panel" aria-label={`Node inspector — ${node.title}`}>
      <header className="inspector-header">
        <div className="inspector-header-top">
          <h3 className="inspector-title">Node Inspector</h3>
          <button
            type="button"
            className="inspector-close"
            onClick={requestClose}
            aria-label="Close inspector"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {isDirty && !confirmingDiscard && (
          <span className="unsaved-badge">Unsaved changes</span>
        )}
      </header>

      <div className="inspector-body">
        {confirmingDiscard ? (
          <div className="discard-card" role="alertdialog" aria-label="Discard unsaved changes">
            <svg className="discard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            <p className="discard-title">Discard unsaved changes?</p>
            <p className="discard-hint">Your edits to this node will be lost.</p>
            <div className="discard-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmingDiscard(false)}>
                Keep editing
              </button>
              <button type="button" className="btn btn-danger" onClick={discardChanges}>
                Discard
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="field">
              <span className="field-label">Type</span>
              <div
                className="type-badge"
                style={{ borderColor: style.border, color: style.titleColor }}
              >
                <span
                  className="type-badge-icon"
                  style={{ color: style.iconColor, backgroundColor: style.iconBackground }}
                  aria-hidden="true"
                >
                  <svg viewBox={icon.viewBox} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                    {icon.paths.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </svg>
                </span>
                <span className="type-badge-text">
                  Step {getNodeStep(node.type)} · {getNodeLabel(node.type)}
                </span>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="inspector-title">
                Title
              </label>
              <input
                id="inspector-title"
                className={'text-input' + (errors.title ? ' has-error' : '')}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="Node title"
                maxLength={120}
              />
              {errors.title && (
                <p className="field-error" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="field field-content">
              <label className="field-label" htmlFor="inspector-content">
                Content
              </label>
              <textarea
                id="inspector-content"
                className={'text-area' + (errors.content ? ' has-error' : '')}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
                }}
                placeholder="Full node content"
                rows={10}
              />
              {errors.content && (
                <p className="field-error" role="alert">
                  {errors.content}
                </p>
              )}
              <p className="field-hint">Content is shown in full on the node.</p>
            </div>

            <div className="agent-block">
              <div className="agent-title">
                <svg
                  className="agent-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
                <span>HexFlow Agent</span>
              </div>
              <p className="agent-hint">
                Regenerate just this {getNodeLabel(node.type)}. The rest of the
                workflow — including your saved edits — stays untouched.
              </p>
              <button
                type="button"
                className="btn btn-agent"
                onClick={handleRegenerate}
                disabled={regenerating || isDirty}
              >
                {regenerating ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" />
                    </svg>
                    <span>Regenerating node…</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="agent-spark"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.5-6.5 2-2M5.5 18.5l2-2m11 2 2 2m-13.5-13.5 2 2" />
                    </svg>
                    <span>Regenerate</span>
                  </>
                )}
              </button>
              {isDirty && !regenerating && (
                <p className="agent-note">
                  Save or cancel your changes before regenerating this node.
                </p>
              )}
              {regenerateError && (
                <p className="field-error" role="alert">
                  {regenerateError}
                </p>
              )}
            </div>

            <div className="inspector-actions">
              <button type="button" className="btn btn-ghost" onClick={requestClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l4 4L19 6" />
                </svg>
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}