/**
 * Workflow generation service
 * Generates creative workflows from a brief using an AI provider (Gemini).
 * The AI returns structured JSON which is validated before it becomes a Workflow.
 */

import type { Workflow, WorkflowNode, WorkflowEdge, NodeType } from '../types/workflow.types';
import { generateWorkflowId, generateNodeId, generateEdgeId } from '../utils/idGenerator';
import { config } from '../config';
import { getAIClient } from './aiClient';
import { SYSTEM_PROMPT } from './systemPrompt';
import { parseAIContent, type AIGeneratedWorkflow } from './validateWorkflow';
import { WorkflowGenerationError } from '../utils/workflowErrors';

/**
 * Deterministic canvas layout for the workflow graph.
 * The AI generates creative content; the backend owns graph geometry.
 */
const NODE_POSITIONS: Record<NodeType, { x: number; y: number }> = {
  brief: { x: 100, y: 100 },
  concept: { x: 400, y: 100 },
  script: { x: 700, y: 100 },
  visual: { x: 400, y: 300 },
  shotlist: { x: 700, y: 300 },
  audio: { x: 400, y: 500 },
  production: { x: 700, y: 500 },
};

/**
 * Standard ordering used to keep the graph layout stable for every workflow.
 */
const NODE_ORDER: NodeType[] = [
  'brief',
  'concept',
  'script',
  'visual',
  'shotlist',
  'audio',
  'production',
];

/**
 * Build edges for the standard production graph.
 */
function buildEdges(byType: Record<NodeType, WorkflowNode>): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [
    { id: generateEdgeId(), source: byType.brief.id, target: byType.concept.id },
    { id: generateEdgeId(), source: byType.concept.id, target: byType.script.id },
    { id: generateEdgeId(), source: byType.concept.id, target: byType.visual.id },
    { id: generateEdgeId(), source: byType.script.id, target: byType.shotlist.id },
    { id: generateEdgeId(), source: byType.visual.id, target: byType.audio.id },
    { id: generateEdgeId(), source: byType.shotlist.id, target: byType.production.id },
    { id: generateEdgeId(), source: byType.audio.id, target: byType.production.id },
  ];

  return edges;
}

/**
 * Materialize validated AI content into a full Workflow object.
 */
function buildWorkflow(aiWorkflow: AIGeneratedWorkflow): Workflow {
  const byType = {} as Record<NodeType, WorkflowNode>;

  const nodes: WorkflowNode[] = NODE_ORDER.map((type) => {
    const node: WorkflowNode = {
      id: generateNodeId(),
      type,
      title: aiWorkflow.nodes[type].title,
      content: aiWorkflow.nodes[type].content,
      position: NODE_POSITIONS[type],
    };
    byType[type] = node;
    return node;
  });

  const edges = buildEdges(byType);

  return {
    id: generateWorkflowId(),
    title: aiWorkflow.title,
    description: aiWorkflow.description,
    nodes,
    edges,
  };
}

/**
 * Generate a complete workflow from a creative brief using the AI provider.
 * @param brief - The creative brief provided by the user
 * @returns A complete, validated Workflow object
 * @throws WorkflowGenerationError if the AI call or its output is invalid
 */
export async function generateWorkflow(brief: string): Promise<Workflow> {
  const ai = getAIClient();

  const userPrompt =
    `Create a production workflow for the following creative brief:\n\n${brief}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
          temperature: 0.8,
        },
      });

      const raw = response.text?.trim();
      if (!raw) {
        throw new WorkflowGenerationError(502, 'AI returned an empty response');
      }

      return buildWorkflow(parseAIContent(raw));
    } catch (error) {
      lastError = error;
      console.error(`[workflowGenerator] AI generation failed (attempt ${attempt + 1}):`, error);
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  if (lastError instanceof WorkflowGenerationError) {
    throw lastError;
  }

  console.error('[workflowGenerator] AI provider request failed after retry:', lastError);
  throw new WorkflowGenerationError(
    502,
    'The AI provider is temporarily unavailable. Please try again in a moment.',
  );
}