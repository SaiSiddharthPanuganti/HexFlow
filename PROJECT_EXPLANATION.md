# HexFlow — Complete Project Explanation

HexFlow is a full-stack "AI Creative Workflow Builder" for creative professionals (filmmakers, editors, designers, agencies, and content teams). A user types a plain-language creative brief, and an AI agent turns it into a structured, connected, production-ready workflow spanning seven stages — from the sharpened brief to the production plan. Every stage is a node on an interactive canvas that the user can inspect, edit by hand, regenerate via AI, or refine in natural language through a chat panel.

This document explains the entire project: what it does, how it is built, how each feature works end-to-end, and the design decisions behind it.

---

## 1. What the app does

1. **Generate** — the user describes a project ("a 30-second cinematic Instagram ad for a premium coffee brand"). The AI returns a complete workflow.
2. **Visualize** — the workflow renders as a graph on a canvas (7 colored nodes, connected edges, step numbers).
3. **Inspect & edit** — clicking a node opens a Node Inspector where the user can rewrite the title and content by hand and save.
4. **Regenerate a node** — the inspector has an "HexFlow Agent" block that regenerates just the selected node with fresh AI content, preserving the overall creative direction.
5. **Chat with the workflow** — a chat panel under the canvas accepts natural-language instructions ("make the concept more cinematic and emphasize close-ups in the shot list") and the AI edits only the affected node(s), leaving everything else — including the user's saved edits — untouched.

No database: the MVP keeps the workflow in memory on the frontend and sends whatever state is needed to the backend on each call.

---

## 2. Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 + TypeScript + Vite 8 | UI, canvas graph, state |
| Graph canvas | @xyflow/react (React Flow) v12 | Interactive node/edge rendering |
| Linting | oxlint | Fast frontend linting |
| Backend | Node.js + Express 5 + TypeScript | REST API + AI orchestration |
| AI provider | Google Gemini via `@google/genai` | All generation, regeneration, and editing |
| Env/secrets | `dotenv`, `backend/.env` | Gemini key stays backend-only |
| Dev tooling | `tsx` (dev), `tsc` (build), Vite proxy | Run/typecheck/build |

Current model: `gemini-2.5-flash` (overridable via `GEMINI_MODEL` in `backend/.env`).

Two folders, one app:

```
hexcoded/
├── backend/          # Express API on port 3000
└── frontend/         # Vite dev server on port 5173, proxies /api → :3000
```

---

## 3. Architecture overview

```
Browser (React + @xyflow/react)
   │  POST /api/workflow/generate          { brief }
   │  POST /api/workflow/regenerate        { brief, node, upstream, downstream }
   │  POST /api/workflow/edit              { brief, instruction, workflow }
   ▼
Vite dev server (port 5173) ── /api proxy ──► Express (port 3000)
                                                │
                                                ├─ routes/workflowRoutes.ts
                                                │      └─ controllers/workflowController.ts
                                                │             └─ services/  (AI calls + validation)
                                                │
                                                ▼
                                        Google Gemini (@google/genai)
```

Backend layering is strict: **routes → controller (validation) → services (AI + parsing) → validated data out**. No AI response ever reaches the client until it has been structurally validated and normalized.

---

## 4. Data model

Defined identically in both apps (shared schema, no code sharing):

- `frontend/src/types/workflow.types.ts`
- `backend/src/types/workflow.types.ts`

**Node types** (the 7 creative stages, in production order):

```
brief ──► concept ──► script ──► shotlist ──► production
              │                        ▲
              └──► visual ──► audio ───┘
```

| Type | Label | Role |
| --- | --- | --- |
| `brief` | Creative Brief | Restate + sharpen objectives, audience, platform, duration, tone |
| `concept` | Concept | High-level creative concept + central visual metaphor |
| `script` | Script | Story beats, scene-by-scene outline, pacing, copy/VO lines |
| `visual` | Visual Direction | Cinematography, camera, color grading, art direction |
| `shotlist` | Shot List | Shot-by-shot breakdown (#, type, action, framing, duration) |
| `audio` | Audio Design | Music style, sound design, VO treatment, mixing notes |
| `production` | Production Plan | Pre-/production/post phases, crew, gear, deliverables |

**Core structures:**

```ts
interface WorkflowNode {
  id: string;            // "node-1", "node-2", ... (server-generated)
  type: NodeType;        // one of the 7 above
  title: string;
  content: string;
  position: { x: number; y: number };   // canvas coordinates
}

interface WorkflowEdge {
  id: string;
  source: string;        // node id
  target: string;        // node id
}

interface Workflow {
  id: string;            // "wf-001", ...
  title: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
```

**IDs** are generated by the backend (`backend/src/utils/idGenerator.ts`) using monotonically increasing counters (`wf-001`, `node-1`, `edge-1`, …). Important consequence: the backend keeps incrementing across requests, so node ids are **not predictable** between workflows.

**Human labels & step numbers** (`backend/src/utils/nodeLabels.ts`, `frontend/src/components/WorkflowCanvas/nodeStyles.ts`) map each type to display names ("Creative Brief", "Shot List", …) and the step badge (1–7) used on the canvas.

---

## 5. API reference

All endpoints live under `backend/src/routes/workflowRoutes.ts` → `controllers/workflowController.ts`. Errors always return `{ error, message }`.

### 5.1 Health

```
GET /api/health
→ 200 { "status": "ok", "message": "HexFlow backend is running" }
```

### 5.2 Generate workflow

```
POST /api/workflow/generate
body: { "brief": "string (non-empty)" }
→ 200 { "workflow": Workflow }
```

- Rejects empty/blank briefs with `400`.
- Calls Gemini with the `SYSTEM_PROMPT`; requests JSON-only output (`responseMimeType: 'application/json'`, up to **8192** output tokens, temperature 0.8).
- Validates the AI object (all 7 node types present, non-empty title/content). Malformed AI output → `502` (details logged server-side; never forwarded).

### 5.3 Regenerate a node

```
POST /api/workflow/regenerate
body: {
  "brief": string,
  "node": WorkflowNode,             // the node being regenerated
  "upstreamNodes": WorkflowNode[],  // nodes that feed into it
  "downstreamNodes": WorkflowNode[] // nodes that must follow from it
}
→ 200 { "node": WorkflowNode }
```

- `400` if any payload node fails the `isValidNode` shape check.
- Sends the target node + its connected neighbors to Gemini (`NODE_REGENERATION_PROMPT`) so the new version stays consistent with the workflow's direction.
- The response preserves the original node's **id, type, and position**; only title/content change.

### 5.4 Edit workflow via chat

```
POST /api/workflow/edit
body: {
  "brief": string,
  "instruction": string,            // natural-language request
  "workflow": Workflow              // current full workflow state
}
→ 200 { "summary": string, "nodes": WorkflowNode[] }   // only changed nodes
```

- `400` if brief/instruction are empty or the workflow fails `isValidWorkflow` (structure + every edge must reference existing node ids).
- Sends the brief, the current workflow (each node id, type label, title, content capped at 500 chars), the edge list (`source -> target`), and the instruction to Gemini (`WORKFLOW_EDIT_PROMPT`).
- The AI returns `{ summary, nodes: { "<existing id>": { title, content } } }`. The backend **rejects any id that is not already in the workflow** (`parseEditedWorkflow`), then maps the result back to full node objects in workflow order, preserving id/type/position.
- If no node would meaningfully change, the AI returns a say-nothing-changed summary + empty `nodes` array (`200`, no-op).

---

## 6. Backend internals

Directory: `backend/src`

### 6.1 Entry (`index.ts`)
Loads `dotenv`, enables `cors()` and `express.json()`, registers `/api/health` and mounts `workflowRoutes` at `/api/workflow`.

### 6.2 Config (`config.ts`)
Reads `PORT` (default 3000), `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.5-flash`) from the environment only. The key is never hard-coded and never exposed to the browser.

### 6.3 AI client (`services/aiClient.ts`)
A lazily-initialized singleton `GoogleGenAI` client. If `GEMINI_API_KEY` is missing it throws a `WorkflowGenerationError(500, …)` with a clear setup hint, so a misconfigured server fails loudly and helpfully.

### 6.4 System prompts (`services/systemPrompt.ts`)
Three prompts, one per feature:

- `SYSTEM_PROMPT` — the architect persona, detailed requirements per stage, quality rules, and the exact JSON schema (all 7 nodes required).
- `NODE_REGENERATION_PROMPT` — regenerate only ONE node, keep direction, use upstream/downstream context, return `{ title, content }`.
- `WORKFLOW_EDIT_PROMPT` — edit only existing nodes, keyed by original ids, return `{ summary, nodes }`; explicit instruction to say so if nothing should change.

### 6.5 Validation (`services/validateWorkflow.ts`)
The trust boundary. Utilities:

- `extractJson(raw)` — strips markdown fenced blocks and stray prose, isolating the JSON object.
- `tryParseJson(raw)` — safe parse returning `undefined` on failure.
- `logRawResponse(context, raw)` — logs the first 600 chars of malformed AI output to stderr for debugging (unsafe data is never sent to the client).
- `parseAIContent(raw)` → validates a full generated workflow.
- `parseRegeneratedNode(raw)` → validates a single node's `{ title, content }`.
- `parseEditedWorkflow(raw, validNodeIds)` → validates an edit result; every returned node id must exist in `validNodeIds`, else `502`.

All three throw `WorkflowGenerationError(status, message)`.

### 6.6 Generation (`services/workflowGenerator.ts`)
- Defines a **deterministic canvas layout** (`NODE_POSITIONS`) and build order (`NODE_ORDER`) and a fixed edge set (`buildEdges`). The AI only produces creative text; the backend owns graph geometry. This keeps every workflow tidy and consistent.
- `generateWorkflow(brief)` calls Gemini, requires non-empty text, parses via `parseAIContent`, then materializes into a full `Workflow` with fresh ids/positions/edges.

### 6.7 Regeneration (`services/nodeRegenerator.ts`)
- Builds a user message with the brief, the target node, and formatted upstream/downstream neighbors (content capped at 400 chars each).
- `regenerateNode(input)` returns `{ ...input.node, title, content }` — identity preserved.

### 6.8 Chat editing (`services/workflowEditor.ts`)
- `formatNode` renders each node to the AI as `[id] (Label) "title"\ncontent` (content capped at 500 chars), plus an edge list `source -> target`.
- `editWorkflow(input)` returns `{ summary, nodes }` where `nodes` are the full, updated node objects **in original workflow order**, filtered to only the ones the AI changed.

### 6.9 Controller (`controllers/workflowController.ts`)
- Handcrafted type guards: `isValidNode`, `isValidEdge`, `isValidWorkflow`, `validateGenerateRequest`, `validateRegenerateRequest`, `validateEditRequest`.
- `isValidWorkflow` additionally requires every edge's `source`/`target` to reference real node ids.
- Each handler: validate → call service → `200` with typed response; `WorkflowGenerationError` → its `.status`; anything else → `500` with a generic message.

---

## 7. Frontend internals

Directory: `frontend/src`

### 7.1 App state (`App.tsx`)
The single page holds three pieces of state:

- `workflow` — the current `Workflow` or `null`.
- `brief` — the original brief, kept so AI calls stay grounded.
- `selectedNodeId` — the inspected node.

Handlers:
- `handleWorkflowGenerated(wf, brief)` — stores both, clears selection.
- `handleNodeSave(id, title, content)` — patches just that node in state.
- `handleNodeRegenerate(nodeId)` — computes upstream/downstream from the edges, POSTs `/api/workflow/regenerate`, and replaces **only** the returned node (preserves other edits and positions).
- `handleWorkflowEdit(instruction)` — POSTs `/api/workflow/edit` with the whole current workflow, then replaces **only** the nodes in the response, by id. Non-edited nodes, edges, and user edits are preserved.

Rendering: a hero + brief form, then — once a workflow exists — the workspace section: `WorkflowCanvas` + `InspectorPanel` in a two-column grid, and `WorkflowChat` beneath it.

### 7.2 Brief form (`components/BriefForm.tsx`)
- Textarea + three one-click example briefs (coffee commercial, product launch, fashion film).
- POSTs to `/api/workflow/generate` with loading spinner and inline error display.

### 7.3 Canvas (`components/WorkflowCanvas/`)
- `workflowToReactFlow(workflow)` maps frontend `Workflow` → React Flow `Node[]`/`Edge[]` with fixed node size (320×140) and styled arrows.
- `WorkflowCanvas.tsx` — the React Flow pane with dot background, zoom controls, fit-view. **Reconciliation is keyed by workflow id**: a new id rebuilds the graph; changes to the same workflow patch only the changed node data, preserving every other node (including its dragged position).
- Smart defaults: node selection on click, deselection on pane click, `fitView`, `nodesConnectable={false}`.
- `WorkflowNode.tsx` — custom node rendering: step badge, type icon, type label, title, truncated content (120-char preview), selected/hover states.
- `nodeStyles.ts` — per-type color palettes, icons (inline SVGs), step numbers, labels.

### 7.4 Node inspector (`components/InspectorPanel/`)
- Empty state ("No node selected"), then an editor for a selected node: type badge (step + label), title input, content textarea, Save / Cancel.
- **Dirty tracking**: local title/content copied from the node prop; any mismatch shows an "Unsaved changes" badge and an Escape/close-with-changes confirm ("Keep editing" / "Discard").
- Validation on save (title and content required).
- **Agent block**: "Regenerate just this X" button — calls `onRegenerate`, shows a spinner, disabled while dirty, surfaces errors inline, refreshes its own local fields after success.
- The panel wraps in a sticky right column (`position: sticky; max-height: calc(100dvh - 120px)`), with a `key` on the selected node so local state resets between different nodes.

### 7.5 Chat panel (`components/WorkflowChat/`)
- Compact card (max-width 760px) below the canvas.
- Message thread with user (right, gradient bubble) and agent (left, neutral bubble) messages; agent responses append "Updated N nodes."
- Empty state shows the hint text and clickable example prompts that pre-fill the input.
- Composer: single-row input + "Apply" button (Enter sends, Shift+Enter newline), spinner + "Applying…" while in flight, error text shown as an agent bubble, "Clear" resets the thread.

### 7.6 Styling
- `index.css` defines design tokens as CSS variables (colors, radii, shadows, gradients, `--container: 1000px`, `--container`-overrides per section).
- Per-component CSS files. The workspace canvas section is wider (`max-width: 1260px`); the chat lives inside that section but as a 760px card.

### 7.7 Dev server (`vite.config.ts`)
Port 5173; **proxies `/api` → `http://localhost:3000`**, so the frontend calls relative paths (`/api/workflow/…`) with no CORS concerns in dev.

---

## 8. Feature walk-throughs

### 8.1 Generate
Typed brief → `POST /generate` → Gemini returns `{ title, description, nodes:{…} }` → `parseAIContent` validates all 7 nodes → `buildWorkflow` assigns ids/positions/edges → canvas renders the connected graph → user can click nodes.

### 8.2 Regenerate one node
User selects a node → clicks Regenerate in the inspector → App derives the node's upstream (edges targeting it) and downstream (edges leaving it) → `POST /regenerate` → Gemini returns a new `{ title, content }` grounded in those neighbors → validated → App replaces that single node → inspector and canvas reflect it; nobody else moves.

### 8.3 Chat edit
User types an instruction → App POSTs the entire current workflow + brief + instruction → Gemini decides which node(s) the instruction touches and returns fresh content only for those, keyed by existing ids → `parseEditedWorkflow` rejects any fabricated id → App merges by id into the workflow → the summary and an agent bubble appear in the thread; the canvas updates only the affected nodes.

---

## 9. Robustness & safety decisions

1. **AI output is never trusted raw.** Every response is JSON-parsed, structurally validated, and normalized before leaving the backend (`validateWorkflow.ts`). Bad output → `502` with a specific message; the raw text is logged server-side for debugging.
2. **JSON extraction tolerates sloppy model output.** Markdown fences and prose around the object are stripped (`extractJson`).
3. **Token budget was tuned to reality.** The generator originally capped at 3000 tokens and Gemini truncated mid-JSON (causing 502s); it is now **8192**. Regeneration and chat-edit use **4096** — an output that is far richer than one node actually needs, so truncation doesn't cut a JSON string in half.
4. **Edits are id-keyed and merge-safe.** Chat and regenerate endpoints return only changed nodes; the frontend replaces by `id`, so user hand-edits, node positions, and edge topology are preserved. `parseEditedWorkflow` guarantees the AI can't invent nodes.
5. **Graph integrity is validated.** `isValidWorkflow` checks that every edge source/target references a real node.
6. **Secrets stay on the server.** The Gemini key lives only in `backend/.env` (`dotenv`); `.env` is git-ignored; `.env.example` documents the required vars. The client only ever talks to Express.
7. **Typed contracts everywhere.** Shared request/response types (`api.types.ts`) and the strict routes → controller → services layering keep the API honest.
8. **Diagnostics without data leaks.** Malformed AI payloads are truncated to 600 chars in server logs, and clients get only generic, actionable messages.

---

## 10. Known limitations & notes

- **No persistence.** Workflows live in React state; a page refresh loses everything. No database is used.
- **IDs restart per backend process** but continue incrementing within a process, so saved test payloads with hard-coded ids can 502 against a fresh server (`parseEditedWorkflow` rejects unknown ids).
- **AI latency.** Each call is a live Gemini round-trip (roughly 9–16s). The "slow" feeling is inherent to synchronous model calls; the UI shows spinners while waiting.
- **Singleton AI client** assumes one model/key for the whole process.
- **Frontend type mirrors backend** manually (no shared package); keep the two `types/workflow.types.ts` files in sync.
- **Canvas + inspector coarse sync:** if the chat edits the node that is currently open in the inspector, the inspector's local draft is not force-refreshed (an edge case, not a data-corruption risk — saving still writes to the same node).

---

## 11. Running it

```bash
# install
cd frontend && npm install
cd ../backend && npm install

# backend env
cd backend
cp .env.example .env        # then set GEMINI_API_KEY (and optionally GEMINI_MODEL, PORT)

# dev — terminal 1
cd frontend && npm run dev     # http://localhost:5173

# dev — terminal 2
cd backend && npm run dev      # API on http://localhost:3000

# production-style
cd backend && npm run build && npm start
cd frontend && npm run build        # outputs to frontend/dist (tsc -b + vite build)
```

Checks:
- `cd backend && npm run build` (TypeScript compile).
- `cd frontend && npm run lint` (oxlint) and `cd frontend && npm run build`.
  - Lint reports two pre-existing `WorkflowCanvas.tsx` warnings (fast-refresh export and ref-in-render) — non-blocking.

---

## 12. Project layout

```
hexcoded/
├── README.md                      # quick overview + setup
├── SETUP.md, WORKFLOW_API.md,
│   WORKFLOW_MODEL.md, API_IMPLEMENTATION_SUMMARY.md   # historical/build docs
├── backend/
│   ├── .env.example               # GEMINI_API_KEY / GEMINI_MODEL / PORT
│   ├── src/
│   │   ├── index.ts               # express bootstrap
│   │   ├── config.ts              # env config
│   │   ├── routes/workflowRoutes.ts
│   │   ├── controllers/workflowController.ts
│   │   ├── services/
│   │   │   ├── aiClient.ts           # Gemini singleton
│   │   │   ├── systemPrompt.ts       # 3 prompts
│   │   │   ├── validateWorkflow.ts   # trust boundary
│   │   │   ├── workflowGenerator.ts  # generate
│   │   │   ├── nodeRegenerator.ts    # regenerate node
│   │   │   └── workflowEditor.ts     # chat edit
│   │   ├── types/
│   │   │   ├── workflow.types.ts     # Workflow/Node/Edge model
│   │   │   └── api.types.ts          # request/response contracts
│   │   └── utils/
│   │       ├── idGenerator.ts        # wf/node/edge ids
│   │       ├── nodeLabels.ts         # human labels
│   │       └── workflowErrors.ts     # WorkflowGenerationError
│   └── test-*.js                    # ad-hoc API smoke tests
└── frontend/
    ├── vite.config.ts              # port 5173 + /api proxy
    └── src/
        ├── main.tsx, App.tsx, App.css, index.css
        ├── types/workflow.types.ts
        └── components/
            ├── BriefForm/           # brief input + examples
            ├── WorkflowCanvas/      # React Flow canvas + custom node
            │   ├── WorkflowCanvas.tsx, WorkflowNode.tsx, nodeStyles.ts
            ├── InspectorPanel/      # node editor + regenerate agent
            └── WorkflowChat/        # chat-to-workflow panel
```