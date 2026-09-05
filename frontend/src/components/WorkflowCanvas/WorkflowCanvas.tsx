import { useCallback, useRef, useEffect } from 'react';
import type { Workflow } from '../../types/workflow.types';
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WorkflowNode from './WorkflowNode';
import './WorkflowCanvas.css';

interface CustomNodeData extends Record<string, unknown> {
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

interface WorkflowCanvasProps {
  workflow: Workflow;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export default function WorkflowCanvas({
  workflow,
  selectedNodeId,
  onNodeSelect,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<any>(null);

  const nodeTypes = useRef({ workflowNode: WorkflowNode });
  const syncedWorkflowId = useRef<string | null>(null);

  // Sync React Flow nodes with the workflow:
  // - A new workflow id resets the whole graph (fresh nodes + edges).
  // - Edits to the same workflow patch only changed node data, preserving
  //   every other node, its dragged position, and all edges.
  useEffect(() => {
    if (workflow.nodes.length === 0) return;

    if (syncedWorkflowId.current !== workflow.id) {
      const { nodes: newNodes, edges: newEdges } = workflowToReactFlow(workflow);
      setNodes(newNodes);
      setEdges(newEdges);
      syncedWorkflowId.current = workflow.id;
      return;
    }

    setNodes((nds) =>
      nds.map((n) => {
        const wfNode = workflow.nodes.find((w) => w.id === n.id);
        if (!wfNode) return n;
        if (wfNode.title !== n.data.title || wfNode.content !== n.data.content) {
          return { ...n, data: { ...n.data, title: wfNode.title, content: wfNode.content } };
        }
        return n;
      }),
    );
  }, [workflow, setNodes, setEdges]);

  // Clear the visual selection when the inspector is closed externally.
  useEffect(() => {
    if (selectedNodeId === null) {
      setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
    }
  }, [selectedNodeId, setNodes]);

  useEffect(() => {
    if (reactFlowInstanceRef.current && nodes.length > 0) {
      requestAnimationFrame(() => {
        reactFlowInstanceRef.current?.fitView({ padding: 0.22, duration: 600 });
      });
    }
  }, [nodes.length]);

  const onInit = useCallback((instance: any) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  return (
    <div className="workflow-canvas-container">
      <div className="workflow-header">
        <div className="workflow-heading">
          <h3 className="workflow-title">{workflow.title}</h3>
          <p className="workflow-description">{workflow.description}</p>
        </div>
        <div className="workflow-stats">
          <div className="stat-item">
            <span className="stat-value">{workflow.nodes.length}</span>
            <span className="stat-label">steps</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{workflow.edges.length}</span>
            <span className="stat-label">connections</span>
          </div>
        </div>
      </div>

      <div className="workflow-flow" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_event, node) => onNodeSelect(node.id)}
          onPaneClick={() => onNodeSelect(null)}
          onInit={onInit}
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.3}
          maxZoom={1.8}
          nodeTypes={nodeTypes.current}
          nodesConnectable={false}
          proOptions={{ hideAttribution: false }}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1.6} color="rgba(255,255,255,0.14)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}