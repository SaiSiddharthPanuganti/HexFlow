import { memo, useState } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { getNodeStyle, getNodeIcon, getNodeLabel, getNodeStep } from './nodeStyles';
import './WorkflowNode.css';

interface CustomNodeData extends Record<string, unknown> {
  type: string;
  title: string;
  content: string;
}

function WorkflowNode({ data, selected }: NodeProps<Node<CustomNodeData>>) {
  const [isHovered, setIsHovered] = useState(false);
  const style = getNodeStyle(data.type);
  const icon = getNodeIcon(data.type);

  const shortContent =
    data.content.length > 120
      ? data.content.substring(0, 120) + '…'
      : data.content;

  return (
    <div
      className={'workflow-node' + (selected ? ' is-selected' : '')}
      style={{
        backgroundColor: style.background,
        borderColor: style.border,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="node-header">
        <span
          className="node-step"
          style={{
            color: style.titleColor,
            borderColor: style.border,
            backgroundColor: style.iconBackground,
          }}
          aria-hidden="true"
        >
          {getNodeStep(data.type)}
        </span>
        <span
          className="node-icon"
          style={{
            color: style.iconColor,
            backgroundColor: style.iconBackground,
          }}
          aria-hidden="true"
        >
          <svg viewBox={icon.viewBox} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            {icon.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </span>
        <span className="node-label" style={{ color: style.titleColor }}>
          {getNodeLabel(data.type)}
        </span>
      </div>

      <div className="node-title" style={{ color: style.titleColor }}>
        {data.title}
      </div>

      <div className="node-content">
        <p className="node-text" style={{ color: style.contentColor }}>
          {shortContent}
        </p>
      </div>

      {isHovered && !selected && (
        <div className="node-hover-indicator" style={{ borderColor: style.border }} />
      )}
      {selected && (
        <div className="node-selected-indicator" style={{ borderColor: style.border }} />
      )}
    </div>
  );
}

export default memo(WorkflowNode);