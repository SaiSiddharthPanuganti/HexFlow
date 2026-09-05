/**
 * Human-readable labels for workflow node types
 */

const NODE_LABELS: Record<string, string> = {
  brief: 'Creative Brief',
  concept: 'Concept',
  script: 'Script',
  visual: 'Visual Direction',
  shotlist: 'Shot List',
  audio: 'Audio Design',
  production: 'Production Plan',
};

export function getNodeLabel(type: string): string {
  return NODE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
}