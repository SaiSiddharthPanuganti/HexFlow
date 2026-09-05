# HexFlow

HexFlow turns a plain-language creative brief into an editable production workflow for filmmakers, editors, designers, agencies, and content teams.

A user describes a project, and HexFlow creates a connected workflow covering the brief, concept, script, visual direction, shot list, audio, and production. Each stage is an editable node. Users can manually revise nodes, regenerate one node with context, or ask the agent to update, add, or remove workflow steps without losing unrelated edits.

## Product Flow

1. Enter a creative brief or choose an example.
2. Generate a structured workflow with Gemini.
3. Explore the connected React Flow canvas.
4. Select a node to edit or regenerate it with upstream and downstream context.
5. Ask the workflow agent to revise content or modify the step structure.
6. Undo, redo, save locally, export JSON, or share the workspace.

The strongest product behavior is scoped AI editing: the agent changes only the affected stages while preserving existing node identity, positions, user edits, and graph integrity.

## Features

- AI-generated creative production workflows
- Seven default workflow stages: brief, concept, script, visual, shot list, audio, and production
- React Flow canvas with connected, draggable nodes
- Node inspector with manual editing and dirty-state protection
- Context-aware single-node regeneration
- Chat-based workflow editing
- Structural workflow edits: update, add, and remove steps
- Automatic edge rebuilding when steps are added or removed
- Undo and redo
- Local browser save and JSON export
- Responsive layout and reduced-motion support

## Architecture

```text
Browser (React + Vite)
  |
  | POST /api/workflow/generate
  | POST /api/workflow/regenerate
  | POST /api/workflow/edit
  v
Express + TypeScript backend
  |
  | request validation
  | AI orchestration
  | JSON parsing and workflow validation
  v
Google Gemini
```

The frontend and backend are separate applications:

- `frontend/`: React 19, TypeScript, Vite, `@xyflow/react`, and oxlint
- `backend/`: Node.js, Express, TypeScript, and `@google/genai`
- `render.yaml`: Render backend service definition
- `frontend/vercel.json`: Vercel frontend configuration

Backend layering is routes -> controllers -> services -> validated workflow data. Gemini responses are never sent directly to the browser: they are parsed, validated, and normalized first.

## Workflow Model

A workflow has this shape:

```ts
interface Workflow {
  id: string;
  title: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}
```

The default production graph is:

```text
Brief -> Concept -> Script -> Shot List -> Production
              |                         ^
              v                         |
           Visual -> Audio -------------+
```

The default stages are a starting structure, not a restriction. The workflow agent can apply these edit operations:

- `updates`: change title/content for existing node IDs
- `removals`: remove existing node IDs
- `additions`: add a typed node after an existing node ID

The backend owns IDs, positions, and edge IDs. Existing nodes keep their identity and positions. Removed nodes have their connected edges removed and neighboring paths reconnected where possible. Added nodes receive generated IDs and positions.

## API

### `GET /api/health`

Returns:

```json
{
  "status": "ok",
  "message": "HexFlow backend is running"
}
```

### `POST /api/workflow/generate`

Request:

```json
{
  "brief": "Create a 30-second cinematic Instagram advertisement for a premium coffee brand."
}
```

Returns a complete validated workflow with generated IDs, deterministic positions, and graph edges.

### `POST /api/workflow/regenerate`

Accepts the original brief, one node, and its upstream/downstream context. Returns the same node identity with new title/content.

### `POST /api/workflow/edit`

Accepts the original brief, a natural-language instruction, and the current workflow. The agent returns a summary and validated structural operations. The backend applies those operations and returns the complete resulting workflow.

Errors use this shape:

```json
{
  "error": "Workflow generation failed",
  "message": "A useful error message"
}
```

## AI Reliability

- JSON-only Gemini responses are requested with `responseMimeType: application/json`.
- Markdown fences and surrounding prose are stripped before parsing.
- Required node types, titles, content, operation types, IDs, and insertion anchors are validated.
- Workflow edge endpoints are checked against current node IDs.
- AI generation retries once for transient provider, empty-response, or malformed-output failures.
- Provider and configuration failures are returned without exposing credentials.
- The backend logs only a short malformed-response snippet for diagnostics.

## Local Development

### Prerequisites

- Node.js
- A Gemini API key for generation features

### Install

```bash
cd frontend
npm ci

cd ../backend
npm ci
```

### Configure the backend

```bash
cd backend
copy .env.example .env
```

Set `GEMINI_API_KEY` in `backend/.env`. The file is ignored and must never be committed.

### Run

Use two terminals:

```bash
# Terminal 1
cd backend
npm run dev
```

```bash
# Terminal 2
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173`. The backend runs on `http://localhost:5000` by default.

For local frontend configuration, `frontend/.env.example` contains:

```text
VITE_API_URL=http://localhost:5000
```

## Deployment

### Vercel frontend

Configure the Vercel project with:

- Root Directory: `frontend`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

Required Vercel environment variable:

```text
VITE_API_URL=https://<your-render-service>.onrender.com
```

Use the actual Render service URL in the Vercel dashboard. Do not commit deployment secrets.

### Render backend

`render.yaml` defines:

- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Required Render environment variables:

```text
NODE_ENV=production
GEMINI_API_KEY=<secret>
FRONTEND_URL=https://<your-vercel-app>.vercel.app
```

Configured model:

```text
GEMINI_MODEL=gemini-3.6-flash
```

Production startup fails clearly if `GEMINI_API_KEY` or `FRONTEND_URL` is missing. Production CORS allows only the exact `FRONTEND_URL`; development allows localhost origins.

## Validation Commands

```bash
cd frontend
npm run build
npm run lint

cd ../backend
npm run build
```

The frontend lint currently reports two non-blocking React Flow warnings concerning fast refresh exports and ref access during render.

## Security

- Gemini credentials stay on the backend.
- `.env`, `.env.local`, and local dependency/build directories are ignored.
- `VITE_API_URL` contains only the public backend URL and must never contain a secret.
- Production CORS requires an explicit frontend origin.
- No authentication or database is included in this prototype.

## Known Limitations

- Workflows are saved in browser local storage, not a shared database.
- Share currently shares the workspace URL; it does not create a server-backed shared workflow.
- AI latency depends on the Gemini provider.
- Frontend and backend workflow types are mirrored manually rather than published from a shared package.
- The standard graph starts with seven stages, but the agent can now add or remove steps through validated structural edits.

## Project Layout

```text
HexFlow/
├── README.md
├── render.yaml
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── tsconfig.json
└── frontend/
    ├── .env.example
    ├── vercel.json
    ├── package.json
    ├── src/
    │   ├── components/
    │   ├── lib/
    │   └── types/
    └── vite.config.ts
```
