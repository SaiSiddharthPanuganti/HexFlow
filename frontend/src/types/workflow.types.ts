/**
 * Workflow data model for HexFlow
 * Compatible with @xyflow/react (React Flow) for future UI integration
 */

/**
 * Supported node types in the creative workflow
 */
export type NodeType =
  | 'brief'
  | 'concept'
  | 'script'
  | 'visual'
  | 'shotlist'
  | 'audio'
  | 'production';

/**
 * Position of a node on the canvas
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Workflow node representing a step in the creative process
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  position: NodePosition;
}

/**
 * Edge connecting two nodes in the workflow
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Complete workflow structure
 */
export interface Workflow {
  id: string;
  title: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Type guard to check if a string is a valid NodeType
 */
export function isValidNodeType(type: string): type is NodeType {
  return [
    'brief',
    'concept',
    'script',
    'visual',
    'shotlist',
    'audio',
    'production',
  ].includes(type);
}
