/**
 * Node regeneration service
 * Regenerates a single node of an existing workflow using the AI provider,
 * preserving the node's identity (id, type, position) and the overall
 * creative direction of the workflow.
 */

import type { WorkflowNode } from '../types/workflow.types';
import { config } from '../config';
import { getAIClient } from './aiClient';
import { NODE_REGENERATION_PROMPT } from './systemPrompt';
import { parseRegeneratedNode } from './validateWorkflow';
import { WorkflowGenerationError } from '../utils/workflowErrors';
import { getNodeLabel } from '../utils/nodeLabels';

export interface RegenerateNodeInput {
  brief: string;
  node: WorkflowNode;
  upstreamNodes: WorkflowNode[];
  downstreamNodes: WorkflowNode[];
}

const MAX_CONTEXT_LENGTH = 400;

function formatNeighbor(label: string, node: WorkflowNode): string {
  const content =
    node.content.length > MAX_CONTEXT_LENGTH
      ? node.content.substring(0, MAX_CONTEXT_LENGTH) + '…'
      : node.content;
  return `- [${label}] "${node.title}": ${content}`;
}

function buildUserMessage(input: RegenerateNodeInput): string {
  const nodeLabel = getNodeLabel(input.node.type);
  const sections: string[] = [];

  sections.push(
    `# Original Creative Brief\n${input.brief}\n`,
  );

  sections.push(
    `# Node to Regenerate\n` +
      `Type: ${nodeLabel} (${input.node.type})\n` +
      `Current title: "${input.node.title}"\n` +
      `Current content: ${input.node.content}\n`,
  );

  if (input.upstreamNodes.length > 0) {
    sections.push(
      `# Upstream Context (what feeds into this node)\n` +
        input.upstreamNodes
          .map((n) => formatNeighbor(getNodeLabel(n.type), n))
          .join('\n') +
        `\n`,
    );
  }

  if (input.downstreamNodes.length > 0) {
    sections.push(
      `# Downstream Context (what must follow from this node)\n` +
        input.downstreamNodes
          .map((n) => formatNeighbor(getNodeLabel(n.type), n))
          .join('\n') +
        `\n`,
    );
  }

  sections.push(
    `Regenerate ONLY the ${nodeLabel} node. Return the new title and content for that node only.`,
  );

  return sections.join('\n');
}

/**
 * Regenerate a single workflow node.
 * Preserves the node's id, type, and position; only title/content change.
 * @throws WorkflowGenerationError if the AI call or its output is invalid
 */
export async function regenerateNode(
  input: RegenerateNodeInput,
): Promise<WorkflowNode> {
  const ai = getAIClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(input) }] }],
      config: {
        systemInstruction: NODE_REGENERATION_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
        temperature: 0.8,
      },
    });
  } catch (error) {
    console.error('[nodeRegenerator] AI provider request failed:', error);
    throw new WorkflowGenerationError(
      502,
      'AI provider request failed. Please try again.',
    );
  }

  const raw = response.text?.trim();
  if (!raw) {
    throw new WorkflowGenerationError(502, 'AI returned an empty response');
  }

  const { title, content } = parseRegeneratedNode(raw);

  return {
    ...input.node,
    title,
    content,
  };
}