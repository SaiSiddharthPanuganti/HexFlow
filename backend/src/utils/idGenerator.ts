export function generateWorkflowId(): string {
  return `wf-${crypto.randomUUID()}`;
}

export function generateNodeId(): string {
  return `node-${crypto.randomUUID()}`;
}

export function generateEdgeId(): string {
  return `edge-${crypto.randomUUID()}`;
}
