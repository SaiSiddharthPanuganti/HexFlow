/**
 * Node styles for different workflow node types
 * Consistent, professional dark interface
 */

export const NODE_WIDTH = 320;
export const NODE_HEIGHT = 140;

export type NodeColors = {
  background: string;
  border: string;
  headerBackground: string;
  titleColor: string;
  contentColor: string;
  iconColor: string;
  iconBackground: string;
};

export const nodeStyles: Record<string, NodeColors> = {
  brief: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(249, 115, 22, 0.42)',
    headerBackground: 'rgba(249, 115, 22, 0.12)',
    titleColor: '#fb923c',
    contentColor: '#d7d8e3',
    iconColor: '#fb923c',
    iconBackground: 'rgba(249, 115, 22, 0.14)',
  },
  concept: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(168, 85, 247, 0.42)',
    headerBackground: 'rgba(168, 85, 247, 0.12)',
    titleColor: '#c084fc',
    contentColor: '#d7d8e3',
    iconColor: '#c084fc',
    iconBackground: 'rgba(168, 85, 247, 0.14)',
  },
  script: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(96, 165, 250, 0.42)',
    headerBackground: 'rgba(96, 165, 250, 0.12)',
    titleColor: '#93c5fd',
    contentColor: '#d7d8e3',
    iconColor: '#93c5fd',
    iconBackground: 'rgba(96, 165, 250, 0.14)',
  },
  visual: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(52, 211, 153, 0.42)',
    headerBackground: 'rgba(52, 211, 153, 0.12)',
    titleColor: '#6ee7b7',
    contentColor: '#d7d8e3',
    iconColor: '#6ee7b7',
    iconBackground: 'rgba(52, 211, 153, 0.14)',
  },
  shotlist: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(251, 113, 133, 0.42)',
    headerBackground: 'rgba(251, 113, 133, 0.12)',
    titleColor: '#fda4af',
    contentColor: '#d7d8e3',
    iconColor: '#fda4af',
    iconBackground: 'rgba(251, 113, 133, 0.14)',
  },
  audio: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(192, 132, 252, 0.42)',
    headerBackground: 'rgba(192, 132, 252, 0.12)',
    titleColor: '#c4b5fd',
    contentColor: '#d7d8e3',
    iconColor: '#c4b5fd',
    iconBackground: 'rgba(192, 132, 252, 0.14)',
  },
  production: {
    background: 'rgba(20, 22, 33, 0.92)',
    border: 'rgba(251, 191, 36, 0.42)',
    headerBackground: 'rgba(251, 191, 36, 0.12)',
    titleColor: '#fcd34d',
    contentColor: '#d7d8e3',
    iconColor: '#fcd34d',
    iconBackground: 'rgba(251, 191, 36, 0.14)',
  },
};

export const getNodeStyle = (type: string): NodeColors => {
  return nodeStyles[type] || nodeStyles.brief;
};

/**
 * Execution step number for each node type, in the order a team uses them.
 */
export const getNodeStep = (type: string): number => {
  const steps: Record<string, number> = {
    brief: 1,
    concept: 2,
    script: 3,
    visual: 4,
    shotlist: 5,
    audio: 6,
    production: 7,
  };
  return steps[type] || 0;
};

export type NodeIcon = {
  viewBox: string;
  paths: string[];
};

export const nodeIcons: Record<string, NodeIcon> = {
  brief: {
    viewBox: '0 0 24 24',
    paths: [
      'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
    ],
  },
  concept: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    ],
  },
  script: {
    viewBox: '0 0 24 24',
    paths: [
      'M16.862 4.487 18.55 2.8a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Zm0 0L19.5 7.125',
    ],
  },
  visual: {
    viewBox: '0 0 24 24',
    paths: [
      'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42',
    ],
  },
  shotlist: {
    viewBox: '0 0 24 24',
    paths: [
      'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5c.621 0 1.125-.504 1.125-1.125m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 8.625H3.375m17.25 0 1.87-.62a2.25 2.25 0 0 0 1.194-3.18l-3.06-6.12',
      'M14.25 3.375v13.875H8.25n4.5 1.5a.75.75 0 1 1 0 1.5.75.75 0 1 1 0-1.5Z',
    ],
  },
  audio: {
    viewBox: '0 0 24 24',
    paths: [
      'M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z',
    ],
  },
  production: {
    viewBox: '0 0 24 24',
    paths: [
      'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.076.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z',
      'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    ],
  },
};

export const getNodeIcon = (type: string): NodeIcon => {
  return nodeIcons[type] || nodeIcons.brief;
};

export const getNodeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    brief: 'Creative Brief',
    concept: 'Concept',
    script: 'Script',
    visual: 'Visual',
    shotlist: 'Shotlist',
    audio: 'Audio',
    production: 'Production',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
};