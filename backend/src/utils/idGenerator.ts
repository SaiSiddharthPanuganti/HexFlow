/**
 * Utility functions for generating unique IDs
 */

let workflowCounter = 1;
let nodeCounter = 1;
let edgeCounter = 1;

/**
 * Generate a unique workflow ID
 */
export function generateWorkflowId(): string {
  const id = `wf-${String(workflowCounter).padStart(3, '0')}`;
  workflowCounter++;
  return id;
}

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  const id = `node-${nodeCounter}`;
  nodeCounter++;
  return id;
}

/**
 * Generate a unique edge ID
 */
export function generateEdgeId(): string {
  const id = `edge-${edgeCounter}`;
  edgeCounter++;
  return id;
}

/**
 * Reset all counters (useful for testing)
 */
export function resetCounters(): void {
  workflowCounter = 1;
  nodeCounter = 1;
  edgeCounter = 1;
}
