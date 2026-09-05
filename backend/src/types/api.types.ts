/**
 * API request and response types for HexFlow
 */

import type { Workflow, WorkflowNode } from './workflow.types';

/**
 * Request body for workflow generation
 */
export interface GenerateWorkflowRequest {
  brief: string;
}

/**
 * Response for workflow generation
 */
export interface GenerateWorkflowResponse {
  workflow: Workflow;
}

/**
 * Request body for regenerating a single workflow node
 */
export interface RegenerateNodeRequest {
  brief: string;
  node: WorkflowNode;
  upstreamNodes: WorkflowNode[];
  downstreamNodes: WorkflowNode[];
}

/**
 * Response for node regeneration
 */
export interface RegenerateNodeResponse {
  node: WorkflowNode;
}

/**
 * Request body for chat-driven workflow editing.
 * The instruction is a natural language request that affects one or more nodes.
 */
export interface EditWorkflowRequest {
  brief: string;
  instruction: string;
  workflow: Workflow;
}

/**
 * Response for workflow editing: the nodes that changed + a summary.
 */
export interface EditWorkflowResponse {
  summary: string;
  nodes: WorkflowNode[];
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
}
