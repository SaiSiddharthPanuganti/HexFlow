/**
 * Runtime validation for the AI's structured workflow output.
 * The AI must return JSON matching the backend Workflow schema.
 * Malformed data is rejected here, never forwarded to the frontend.
 */

import type { NodeType, Workflow } from '../types/workflow.types';
import { isValidNodeType } from '../types/workflow.types';
import { WorkflowGenerationError } from '../utils/workflowErrors';

export interface AINodeContent {
  title: string;
  content: string;
}

export interface AIGeneratedWorkflow {
  title: string;
  description: string;
  nodes: Record<NodeType, AINodeContent>;
}

const REQUIRED_NODE_TYPES: NodeType[] = [
  'brief',
  'concept',
  'script',
  'visual',
  'shotlist',
  'audio',
  'production',
];

/**
 * Extract JSON text from a raw AI response.
 * Handles markdown code fences (```json ... ```) and stray prose around the object.
 */
function extractJson(raw: string): string {
  const trimmed = raw.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.substring(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function tryParseJson(raw: string): unknown {
  const candidate = extractJson(raw);
  try {
    return JSON.parse(candidate);
  } catch {
    return undefined;
  }
}

function logRawResponse(context: string, raw: string): void {
  const snippet = raw.length > 600 ? `${raw.substring(0, 600)}…` : raw;
  console.error(`[validateWorkflow] ${context} — raw AI response:\n${snippet}`);
}

/**
 * Parse the raw AI response text and validate it against the workflow schema.
 * @throws WorkflowGenerationError if the data is not valid
 */
export function parseAIContent(raw: string): AIGeneratedWorkflow {
  const parsed = tryParseJson(raw);
  if (parsed === undefined) {
    logRawResponse('malformed workflow JSON', raw);
    throw new WorkflowGenerationError(
      502,
      'AI returned malformed data that could not be parsed as JSON',
    );
  }

  return validateAIGeneratedWorkflow(parsed);
}

function validateAIGeneratedWorkflow(value: unknown): AIGeneratedWorkflow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new WorkflowGenerationError(
      502,
      'AI returned invalid data: expected a JSON object',
    );
  }

  const issues: string[] = [];
  const obj = value as Record<string, unknown>;

  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    issues.push('"title" must be a non-empty string');
  }
  if (typeof obj.description !== 'string' || obj.description.trim().length === 0) {
    issues.push('"description" must be a non-empty string');
  }

  const nodes = obj.nodes;
  if (!nodes || typeof nodes !== 'object' || Array.isArray(nodes)) {
    issues.push('"nodes" must be an object keyed by node type');
  } else {
    const nodeMap = nodes as Record<string, unknown>;
    for (const type of REQUIRED_NODE_TYPES) {
      const node = nodeMap[type];
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        issues.push(`missing node definition for "${type}"`);
        continue;
      }
      const nodeObj = node as Record<string, unknown>;
      if (typeof nodeObj.title !== 'string' || nodeObj.title.trim().length === 0) {
        issues.push(`node "${type}" must have a non-empty "title"`);
      }
      if (typeof nodeObj.content !== 'string' || nodeObj.content.trim().length === 0) {
        issues.push(`node "${type}" must have non-empty "content"`);
      }
    }
  }

  if (issues.length > 0) {
    throw new WorkflowGenerationError(
      502,
      `AI returned invalid workflow data: ${issues.join('; ')}`,
    );
  }

  const workflow: AIGeneratedWorkflow = {
    title: (obj.title as string).trim(),
    description: (obj.description as string).trim(),
    nodes: {} as Record<NodeType, AINodeContent>,
  };

  for (const type of REQUIRED_NODE_TYPES) {
    const node = (nodes as Record<string, AINodeContent>)[type];
    workflow.nodes[type] = {
      title: node.title.trim(),
      content: node.content.trim(),
    };
  }

  return workflow;
}

/**
 * Parse the raw AI response for a single regenerated node and validate it.
 * @returns the validated title/content pair
 * @throws WorkflowGenerationError if the data is not valid
 */
export function parseRegeneratedNode(raw: string): AINodeContent {
  const parsed = tryParseJson(raw);
  if (parsed === undefined) {
    logRawResponse('malformed regenerated node JSON', raw);
    throw new WorkflowGenerationError(
      502,
      'AI returned malformed data that could not be parsed as JSON',
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    logRawResponse('non-object regenerated node JSON', raw);
    throw new WorkflowGenerationError(
      502,
      'AI returned invalid data: expected a JSON object',
    );
  }

  const obj = parsed as Record<string, unknown>;
  const issues: string[] = [];

  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    issues.push('new node "title" must be a non-empty string');
  }
  if (typeof obj.content !== 'string' || obj.content.trim().length === 0) {
    issues.push('new node "content" must be a non-empty string');
  }

  if (issues.length > 0) {
    throw new WorkflowGenerationError(
      502,
      `AI returned invalid regenerated node data: ${issues.join('; ')}`,
    );
  }

  return {
    title: (obj.title as string).trim(),
    content: (obj.content as string).trim(),
  };
}

export interface AIEditedNode {
  title: string;
  content: string;
}

export interface AIEditResult {
  summary: string;
  updates: Record<string, AIEditedNode>;
  removals: string[];
  additions: AIAddedNode[];
}

export interface AIAddedNode {
  type: NodeType;
  title: string;
  content: string;
  after: string;
}

/**
 * Parse the raw AI response for a chat-driven workflow edit and validate it.
 * Every node id in the response must reference an existing workflow node.
 * @throws WorkflowGenerationError if the data is not valid
 */
export function parseEditedWorkflow(
  raw: string,
  workflow: Workflow,
): AIEditResult {
  const parsed = tryParseJson(raw);
  if (parsed === undefined) {
    logRawResponse('malformed workflow edit JSON', raw);
    throw new WorkflowGenerationError(
      502,
      'AI returned malformed data that could not be parsed as JSON',
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    logRawResponse('non-object workflow edit JSON', raw);
    throw new WorkflowGenerationError(
      502,
      'AI returned invalid data: expected a JSON object',
    );
  }

  const obj = parsed as Record<string, unknown>;
  const issues: string[] = [];
  const validIdSet = new Set(workflow.nodes.map((node) => node.id));

  if (typeof obj.summary !== 'string' || obj.summary.trim().length === 0) {
    issues.push('"summary" must be a non-empty string');
  }

  const updates = obj.updates;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    issues.push('"updates" must be an object keyed by existing node ids');
  } else {
    const nodeMap = updates as Record<string, unknown>;
    for (const [id, node] of Object.entries(nodeMap)) {
      if (!validIdSet.has(id)) {
        issues.push(`"${id}" is not an existing node id`);
        continue;
      }
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        issues.push(`node "${id}" must be an object with "title" and "content"`);
        continue;
      }
      const nodeObj = node as Record<string, unknown>;
      if (typeof nodeObj.title !== 'string' || nodeObj.title.trim().length === 0) {
        issues.push(`node "${id}" must have a non-empty "title"`);
      }
      if (typeof nodeObj.content !== 'string' || nodeObj.content.trim().length === 0) {
        issues.push(`node "${id}" must have non-empty "content"`);
      }
    }
  }

  const removals = obj.removals;
  if (!Array.isArray(removals)) {
    issues.push('"removals" must be an array of existing node ids');
  } else {
    for (const id of removals) {
      if (typeof id !== 'string' || !validIdSet.has(id)) {
        issues.push(`removal "${String(id)}" is not an existing node id`);
      }
    }
  }

  const additions = obj.additions;
  if (!Array.isArray(additions)) {
    issues.push('"additions" must be an array of new workflow steps');
  } else {
    for (const addition of additions) {
      if (!addition || typeof addition !== 'object' || Array.isArray(addition)) {
        issues.push('each addition must be an object');
        continue;
      }
      const node = addition as Record<string, unknown>;
      if (typeof node.type !== 'string' || !isValidNodeType(node.type)) {
        issues.push('each addition must use a valid node type');
      }
      if (typeof node.title !== 'string' || node.title.trim().length === 0) {
        issues.push('each addition must have a non-empty "title"');
      }
      if (typeof node.content !== 'string' || node.content.trim().length === 0) {
        issues.push('each addition must have non-empty "content"');
      }
      if (typeof node.after !== 'string' || !validIdSet.has(node.after)) {
        issues.push('each addition must reference an existing node id in "after"');
      } else if (Array.isArray(removals) && removals.includes(node.after)) {
        issues.push('an addition cannot be inserted after a node being removed');
      }
    }
  }

  if (issues.length > 0) {
    throw new WorkflowGenerationError(
      502,
      `AI returned invalid workflow edit data: ${issues.join('; ')}`,
    );
  }

  const editedNodes: Record<string, AIEditedNode> = {};
  for (const [id, node] of Object.entries(updates as Record<string, AIEditedNode>)) {
    editedNodes[id] = {
      title: node.title.trim(),
      content: node.content.trim(),
    };
  }

  return {
    summary: (obj.summary as string).trim(),
    updates: editedNodes,
    removals: (removals as string[]).filter((id, index, ids) => ids.indexOf(id) === index),
    additions: (additions as Array<Record<string, unknown>>).map((node) => ({
      type: node.type as NodeType,
      title: (node.title as string).trim(),
      content: (node.content as string).trim(),
      after: node.after as string,
    })),
  };
}