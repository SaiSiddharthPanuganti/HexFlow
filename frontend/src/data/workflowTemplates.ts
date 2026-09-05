export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  brief: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'product-commercial',
    name: 'Product Commercial',
    description: 'A polished hero spot built around a clear product moment.',
    category: 'Brand Film',
    brief:
      'Create a 30-second premium coffee commercial for an urban audience. The visual style should feel cinematic and warm, with macro shots of coffee preparation, close-ups of texture and steam, and a final product hero shot. The campaign should communicate craftsmanship and an elevated morning ritual.',
  },
  {
    id: 'social-media-campaign',
    name: 'Social Media Campaign',
    description: 'A short-form campaign with a strong hook and platform-ready cutdowns.',
    category: 'Social Campaign',
    brief:
      'Create a short-form social campaign launching a compact wireless speaker for music-loving students and young professionals. Build a 20-second vertical hero video around an immediate visual hook, energetic product demonstrations, and a memorable end card, then plan 10-second and 6-second cutdowns for TikTok, Instagram Reels, and YouTube Shorts.',
  },
  {
    id: 'fashion-film',
    name: 'Fashion Film',
    description: 'An editorial visual world with deliberate mood, movement, and music.',
    category: 'Editorial',
    brief:
      'Create a 60-second cinematic fashion film for an emerging luxury label. Target an editorial audience with a nocturnal, sculptural mood: hard side light, rich black textures, slow controlled camera movement, and tactile close-ups of tailoring and fabric. Build a visual language around transformation and pair it with an original, atmospheric score.',
  },
  {
    id: 'product-launch-campaign',
    name: 'Product Launch Campaign',
    description: 'A launch system that connects one hero story to useful social deliverables.',
    category: 'Launch Campaign',
    brief:
      'Create a product launch campaign for a new health-focused smartwatch targeting prospective customers who want a more intentional daily routine. Develop a 45-second hero video that moves from a relatable morning problem to a confident product solution, with clear messaging, premium visual direction, and a production plan for 15-second and 6-second social cutdowns across paid and organic channels.',
  },
];
