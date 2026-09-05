/**
 * Workflow controller
 * Handles HTTP requests for workflow operations
 */

import type { Request, Response } from 'express';
import type {
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
  RegenerateNodeRequest,
  RegenerateNodeResponse,
  EditWorkflowRequest,
  EditWorkflowResponse,
  ErrorResponse,
} from '../types/api.types';
import type { Workflow, WorkflowNode, WorkflowEdge } from '../types/workflow.types';
import { generateWorkflow } from '../services/workflowGenerator';
import { regenerateNode } from '../services/nodeRegenerator';
import { editWorkflow } from '../services/workflowEditor';
import { WorkflowGenerationError } from '../utils/workflowErrors';
import { isValidNodeType } from '../types/workflow.types';

/**
 * Validate the workflow generation request
 */
function validateGenerateRequest(body: any): body is GenerateWorkflowRequest {
  return (
    body &&
    typeof body === 'object' &&
    'brief' in body &&
    typeof body.brief === 'string' &&
    body.brief.trim().length > 0
  );
}

/**
 * Validate a workflow node object
 */
function isValidNode(value: any): value is WorkflowNode {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.type === 'string' &&
    isValidNodeType(value.type) &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    value.position &&
    typeof value.position === 'object' &&
    typeof value.position.x === 'number' &&
    typeof value.position.y === 'number'
  );
}

/**
 * Validate the node regeneration request
 */
function validateRegenerateRequest(body: any): body is RegenerateNodeRequest {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.brief === 'string' &&
    body.brief.trim().length > 0 &&
    isValidNode(body.node) &&
    Array.isArray(body.upstreamNodes) &&
    body.upstreamNodes.every(isValidNode) &&
    Array.isArray(body.downstreamNodes) &&
    body.downstreamNodes.every(isValidNode)
  );
}

/**
 * Validate a workflow edge object
 */
function isValidEdge(value: any): value is WorkflowEdge {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.source === 'string' &&
    typeof value.target === 'string'
  );
}

/**
 * Validate a complete workflow object
 */
function isValidWorkflow(value: any): value is Workflow {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    !Array.isArray(value.nodes) ||
    !value.nodes.every(isValidNode) ||
    !Array.isArray(value.edges)
  ) {
    return false;
  }

  // Every edge must connect nodes that actually exist in this workflow
  const nodeIds = new Set(value.nodes.map((n: WorkflowNode) => n.id));
  return value.edges.every(
    (e: WorkflowEdge) => nodeIds.has(e.source) && nodeIds.has(e.target),
  );
}

/**
 * Validate the workflow edit request
 */
function validateEditRequest(body: any): body is EditWorkflowRequest {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.brief === 'string' &&
    body.brief.trim().length > 0 &&
    typeof body.instruction === 'string' &&
    body.instruction.trim().length > 0 &&
    isValidWorkflow(body.workflow)
  );
}

/**
 * POST /api/workflow/generate
 * Generate a creative workflow from a brief using the AI provider
 */
export async function generateWorkflowHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    if (!validateGenerateRequest(req.body)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request',
        message: 'Request body must contain a non-empty "brief" string',
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Generate workflow
    const workflow = await generateWorkflow(req.body.brief);

    // Return successful response
    const response: GenerateWorkflowResponse = {
      workflow,
    };
    res.status(200).json(response);
  } catch (error) {
    // Return a useful, specific error for known generation failures
    if (error instanceof WorkflowGenerationError) {
      const errorResponse: ErrorResponse = {
        error: 'Workflow generation failed',
        message: error.message,
      };
      res.status(error.status).json(errorResponse);
      return;
    }

    // Handle unexpected errors
    console.error('Error generating workflow:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred while generating the workflow',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/workflow/regenerate
 * Regenerate a single workflow node while preserving the overall creative direction
 */
export async function regenerateNodeHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    if (!validateRegenerateRequest(req.body)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request',
        message:
          'Request body must include a non-empty "brief", a valid "node", and valid "upstreamNodes"/"downstreamNodes" arrays',
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Regenerate only the selected node
    const node = await regenerateNode({
      brief: req.body.brief,
      node: req.body.node,
      upstreamNodes: req.body.upstreamNodes,
      downstreamNodes: req.body.downstreamNodes,
    });

    // Return successful response
    const response: RegenerateNodeResponse = {
      node,
    };
    res.status(200).json(response);
  } catch (error) {
    if (error instanceof WorkflowGenerationError) {
      const errorResponse: ErrorResponse = {
        error: 'Node regeneration failed',
        message: error.message,
      };
      res.status(error.status).json(errorResponse);
      return;
    }

    console.error('Error regenerating node:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred while regenerating the node',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/workflow/edit
 * Apply a natural-language instruction to the workflow via the agent
 */
export async function editWorkflowHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    if (!validateEditRequest(req.body)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request',
        message:
          'Request body must include a non-empty "brief", a non-empty "instruction", and a valid "workflow" object',
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Edit only the affected node(s)
    const result = await editWorkflow({
      brief: req.body.brief,
      instruction: req.body.instruction,
      workflow: req.body.workflow,
    });

    // Return successful response
    const response: EditWorkflowResponse = {
      summary: result.summary,
      nodes: result.nodes,
    };
    res.status(200).json(response);
  } catch (error) {
    if (error instanceof WorkflowGenerationError) {
      const errorResponse: ErrorResponse = {
        error: 'Workflow edit failed',
        message: error.message,
      };
      res.status(error.status).json(errorResponse);
      return;
    }

    console.error('Error editing workflow:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred while editing the workflow',
    };
    res.status(500).json(errorResponse);
  }
}