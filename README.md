# HexFlow - AI Creative Workflow Builder

Production-quality MVP for creative professionals.

## Project Structure

```
hexflow/
├── frontend/   # React + TypeScript + Vite
├── backend/    # Node.js + Express + TypeScript
└── README.md
```

## Development Setup

### Install Dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### Configure Environment Variables

The backend requires a Gemini API key. Copy the template and add your key — it is read only on the backend and never sent to the browser.

```bash
cd backend
cp .env.example .env
# edit .env and set GEMINI_API_KEY
```

Never commit `.env` (it is git-ignored).

### Running the Application

**Option 1: Run separately in two terminals**

Terminal 1 (Frontend):
```bash
cd frontend
npm run dev
```

Terminal 2 (Backend):
```bash
cd backend
npm run dev
```

**Option 2: Use root scripts (requires concurrently)**

```bash
npm install -g concurrently
npm run dev
```

## Project Structure

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Node Editor**: @xyflow/react
- **AI**: Gemini-driven workflow generation (structured JSON, validated before delivery)
- **No database** for this MVP

## API Endpoints

### Health Check
```
GET /api/health
Response: { "status": "ok", "message": "HexFlow backend is running" }
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Styling**: CSS modules or styled-components (to be determined)
- **Node Editor**: React Flow (to be integrated later)