/**
 * Workflow editing service (Chat to Workflow)
 * Accepts a natural-language instruction plus the current workflow state and
 * asks the AI to modify only the affected node(s). Unchanged nodes (including
 * user edits) are never touched.
 */

import type { Workflow, WorkflowEdge, WorkflowNode } from '../types/workflow.types';
import { generateEdgeId, generateNodeId } from '../utils/idGenerator';
import { config } from '../config';
import { getAIClient } from './aiClient';
import { WORKFLOW_EDIT_PROMPT } from './systemPrompt';
import { parseEditedWorkflow } from './validateWorkflow';
import { WorkflowGenerationError } from '../utils/workflowErrors';
import { getNodeLabel } from '../utils/nodeLabels';

const MAX_CONTEXT_LENGTH = 500;

export interface EditWorkflowInput {
  brief: string;
  instruction: string;
  workflow: Workflow;
}

export interface EditWorkflowResult {
  summary: string;
  workflow: Workflow;
}

function formatNode(node: WorkflowNode): string {
  const content =
    node.content.length > MAX_CONTEXT_LENGTH
      ? node.content.substring(0, MAX_CONTEXT_LENGTH) + '…'
      : node.content;
  return `[${node.id}] (${getNodeLabel(node.type)}) "${node.title}"\n${content}`;
}

function buildUserMessage(input: EditWorkflowInput): string {
  const edgeList = input.workflow.edges
    .map((e) => `${e.source} -> ${e.target}`)
    .join('\n');

  return [
    `# Original Creative Brief\n${input.brief}\n`,
    `# Current Workflow\n` +
      input.workflow.nodes.map(formatNode).join('\n\n') +
      `\n`,
    `# Connections\n${edgeList || '(none)'}\n`,
    `# User Instruction\n${input.instruction}\n`,
    `Apply the instruction using updates, removals, and additions. Return the summary and the exact operation object requested by the system instructions.`,
  ].join('\n');
}

function applyStructuralEdits(workflow: Workflow, result: ReturnType<typeof parseEditedWorkflow>): Workflow {
  const removedIds = new Set(result.removals);
  let nodes = workflow.nodes
    .filter((node) => !removedIds.has(node.id))
    .map((node) => {
      const update = result.updates[node.id];
      return update ? { ...node, title: update.title, content: update.content } : node;
    });

  let edges = workflow.edges.filter(
    (edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target),
  );

  const addEdge = (source: string, target: string) => {
    if (source === target || edges.some((edge) => edge.source === source && edge.target === target)) return;
    edges.push({ id: generateEdgeId(), source, target });
  };

  for (const removedId of result.removals) {
    const incoming = workflow.edges.filter((edge) => edge.target === removedId);
    const outgoing = workflow.edges.filter((edge) => edge.source === removedId);
    for (const incomingEdge of incoming) {
      for (const outgoingEdge of outgoing) {
        if (!removedIds.has(incomingEdge.source) && !removedIds.has(outgoingEdge.target)) {
          addEdge(incomingEdge.source, outgoingEdge.target);
        }
      }
    }
  }

  for (const addition of result.additions) {
    const anchorIndex = nodes.findIndex((node) => node.id === addition.after);
    if (anchorIndex === -1) continue;

    const anchor = nodes[anchorIndex];
    const newNode: WorkflowNode = {
      id: generateNodeId(),
      type: addition.type,
      title: addition.title,
      content: addition.content,
      position: { x: anchor.position.x + 320, y: anchor.position.y + 120 },
    };

    const outgoingTargets = edges
      .filter((edge) => edge.source === anchor.id)
      .map((edge) => edge.target);
    edges = edges.filter((edge) => edge.source !== anchor.id);
    nodes.splice(anchorIndex + 1, 0, newNode);
    addEdge(anchor.id, newNode.id);
    for (const target of outgoingTargets) addEdge(newNode.id, target);
  }

  return { ...workflow, nodes, edges };
}

/**
 * Apply a natural-language instruction to the workflow.
 * Returns only the nodes that changed, preserving id/type/position.
 * @throws WorkflowGenerationError if the AI call or its output is invalid
 */
export async function editWorkflow(
  input: EditWorkflowInput,
): Promise<EditWorkflowResult> {
  const ai = getAIClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(input) }] }],
      config: {
        systemInstruction: WORKFLOW_EDIT_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    });
  } catch (error) {
    console.error('[workflowEditor] AI provider request failed:', error);
    throw new WorkflowGenerationError(
      502,
      'AI provider request failed. Please try again.',
    );
  }

  const raw = response.text?.trim();
  if (!raw) {
    throw new WorkflowGenerationError(502, 'AI returned an empty response');
  }

  const parsed = parseEditedWorkflow(raw, input.workflow);
  const workflow = applyStructuralEdits(input.workflow, parsed);

  return {
    summary: parsed.summary,
    workflow,
  };
}