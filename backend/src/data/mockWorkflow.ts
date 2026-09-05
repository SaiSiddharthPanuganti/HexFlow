import type { Workflow } from '../types/workflow.types';

/**
 * Mock workflow example: Product Launch Video Campaign
 * This is static data for development and testing purposes
 */
export const mockWorkflow: Workflow = {
  id: 'wf-001',
  title: 'Product Launch Video Campaign',
  description:
    'Complete video production workflow for launching a new tech product, from initial brief to final production.',
  nodes: [
    {
      id: 'node-1',
      type: 'brief',
      title: 'Creative Brief',
      content:
        'Launch video for TechFlow Pro smartwatch. Target audience: 25-40 tech enthusiasts. Key message: seamless integration with daily life. Duration: 60 seconds. Tone: energetic, modern, aspirational.',
      position: { x: 100, y: 100 },
    },
    {
      id: 'node-2',
      type: 'concept',
      title: 'Visual Concept',
      content:
        'Day-in-the-life narrative showing the smartwatch adapting to different scenarios: morning workout, work meetings, evening relaxation. Emphasize sleek design and intuitive interface.',
      position: { x: 400, y: 100 },
    },
    {
      id: 'node-3',
      type: 'script',
      title: 'Script & Storyboard',
      content:
        'Scene 1: Wake up - watch tracks sleep quality. Scene 2: Gym - heart rate monitoring. Scene 3: Office - notifications and calendar. Scene 4: Evening - fitness summary. Voiceover: "Your life, seamlessly connected."',
      position: { x: 700, y: 100 },
    },
    {
      id: 'node-4',
      type: 'visual',
      title: 'Visual Direction',
      content:
        'Cinematography: Clean, modern aesthetic with soft natural lighting. Color palette: midnight blue, silver, white. Shot composition: close-ups of watch interface, wide shots establishing context. Smooth transitions between scenes.',
      position: { x: 400, y: 300 },
    },
    {
      id: 'node-5',
      type: 'shotlist',
      title: 'Shot List',
      content:
        '1. CU: Watch display showing sleep data\n2. MS: Person stretching in bedroom\n3. CU: Heart rate during workout\n4. WS: Modern office environment\n5. CU: Notification interaction\n6. MS: Evening routine\n7. CU: Daily summary on watch',
      position: { x: 700, y: 300 },
    },
    {
      id: 'node-6',
      type: 'audio',
      title: 'Audio Design',
      content:
        'Music: Upbeat electronic track with organic elements. Sound design: UI interaction sounds, ambient environment audio. Voiceover: Professional, warm, confident tone. Mix: Music beds under scenes, full mix for finale.',
      position: { x: 400, y: 500 },
    },
    {
      id: 'node-7',
      type: 'production',
      title: 'Production Schedule',
      content:
        'Pre-production: 3 days (location scouting, talent casting). Production: 2 days (4 locations). Post-production: 5 days (editing, color grading, sound mix, final delivery). Total: 10 business days.',
      position: { x: 700, y: 500 },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    },
    {
      id: 'edge-2',
      source: 'node-2',
      target: 'node-3',
    },
    {
      id: 'edge-3',
      source: 'node-2',
      target: 'node-4',
    },
    {
      id: 'edge-4',
      source: 'node-3',
      target: 'node-5',
    },
    {
      id: 'edge-5',
      source: 'node-4',
      target: 'node-6',
    },
    {
      id: 'edge-6',
      source: 'node-5',
      target: 'node-7',
    },
    {
      id: 'edge-7',
      source: 'node-6',
      target: 'node-7',
    },
  ],
};
