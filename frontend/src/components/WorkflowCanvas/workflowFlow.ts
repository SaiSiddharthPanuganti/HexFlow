import type { Edge, Node } from '@xyflow/react';
import type { Workflow } from '../../types/workflow.types';

export interface CustomNodeData extends Record<string, unknown> {
  type: string;
  title: string;
  content: string;
}

export function workflowToReactFlow(workflow: Workflow): {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<CustomNodeData>[] = workflow.nodes.map((node) => ({
    id: node.id,
    type: 'workflowNode',
    position: node.position,
    data: {
      type: node.type,
      title: node.title,
      content: node.content,
    },
    style: { width: 320, height: 140 },
  }));

  const edges: Edge[] = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'default',
    style: {
      stroke: 'rgba(166, 167, 184, 0.5)',
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed' as const,
      color: 'rgba(166, 167, 184, 0.5)',
    },
  }));

  return { nodes, edges };
}
