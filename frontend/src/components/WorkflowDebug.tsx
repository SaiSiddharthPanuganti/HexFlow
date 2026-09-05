import type { Workflow } from '../types/workflow.types';
import './WorkflowDebug.css';

interface WorkflowDebugProps {
  workflow: Workflow;
}

export default function WorkflowDebug({ workflow }: WorkflowDebugProps) {
  return (
    <div className="workflow-debug">
      <div className="debug-header">
        <div className="debug-title">
          <svg className="debug-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3>Workflow Generated Successfully</h3>
        </div>
        <div className="workflow-summary">
          <div className="summary-item">
            <span className="summary-label">Nodes:</span>
            <span className="summary-value">{workflow.nodes.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Connections:</span>
            <span className="summary-value">{workflow.edges.length}</span>
          </div>
        </div>
      </div>

      <div className="workflow-info">
        <h4 className="workflow-title">{workflow.title}</h4>
        <p className="workflow-description">{workflow.description}</p>
      </div>

      <details className="debug-details">
        <summary className="debug-summary">View Raw JSON</summary>
        <pre className="debug-json">
          <code>{JSON.stringify(workflow, null, 2)}</code>
        </pre>
      </details>
    </div>
  );
}
