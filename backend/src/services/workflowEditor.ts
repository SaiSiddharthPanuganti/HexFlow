/**
 * Workflow editing service (Chat to Workflow)
 * Accepts a natural-language instruction plus the current workflow state and
 * asks the AI to modify only the affected node(s). Unchanged nodes (including
 * user edits) are never touched.
 */

import type { Workflow, WorkflowNode } from '../types/workflow.types';
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
  nodes: WorkflowNode[];
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
    `Apply the instruction by editing only the existing node(s) above. Return the summary and the updated node(s) keyed by their existing ids.`,
  ].join('\n');
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

  const validNodeIds = input.workflow.nodes.map((n) => n.id);
  const parsed = parseEditedWorkflow(raw, validNodeIds);

  const byId = new Map(input.workflow.nodes.map((n) => [n.id, n]));

  // Keep workflow node order in the response.
  const nodes: WorkflowNode[] = input.workflow.nodes.flatMap((original) => {
    const edited = parsed.nodes[original.id];
    if (!edited) return [];
    return [
      {
        ...original,
        title: edited.title,
        content: edited.content,
      },
    ];
  });

  return {
    summary: parsed.summary,
    nodes,
  };
}