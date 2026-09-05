# HexFlow Workflow Generation API

## Overview

Backend API for generating creative workflows from a brief. Currently uses deterministic mock generation with intelligent brief analysis.

## Endpoint

### POST /api/workflow/generate

Generate a complete creative workflow from a brief description.

**Request:**
```json
{
  "brief": "Create a 30 second cinematic Instagram advertisement for a premium coffee brand targeting young professionals."
}
```

**Success Response (200):**
```json
{
  "workflow": {
    "id": "wf-001",
    "title": "Instagram Coffee brand Campaign",
    "description": "Complete 30 seconds video production workflow for Instagram...",
    "nodes": [
      {
        "id": "node-1",
        "type": "brief",
        "title": "Creative Brief",
        "content": "Create a 30 second cinematic...",
        "position": { "x": 100, "y": 100 }
      }
      // ... 6 more nodes
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
      // ... 6 more edges
    ]
  }
}
```

**Error Response (400 - Invalid Request):**
```json
{
  "error": "Invalid request",
  "message": "Request body must contain a non-empty \"brief\" string"
}
```

**Error Response (500 - Server Error):**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while generating the workflow"
}
```

## Validation Rules

- `brief` field is **required**
- `brief` must be a **string**
- `brief` cannot be **empty** or **whitespace-only**

## Implementation Architecture

### Files Created

**Types:**
- `backend/src/types/api.types.ts` - API request/response types

**Services:**
- `backend/src/services/workflowGenerator.ts` - Workflow generation logic
- `backend/src/utils/idGenerator.ts` - Unique ID generation utilities

**Controllers:**
- `backend/src/controllers/workflowController.ts` - Request validation and error handling

**Routes:**
- `backend/src/routes/workflowRoutes.ts` - Route definitions

**Server:**
- `backend/src/index.ts` - Updated to include workflow routes

### Design Principles

1. **Modular Architecture**: Separation of concerns (routes → controller → service)
2. **Type Safety**: Full TypeScript typing for requests, responses, and internal data
3. **Error Handling**: Proper HTTP status codes and error messages
4. **Validation**: Request validation before processing
5. **Deterministic**: Same brief produces consistent output (for now)

## Workflow Generation Logic

The service analyzes the brief to extract:

- **Duration**: 15s, 30s, 60s, 90s (default: 60s)
- **Platform**: Instagram, YouTube, TikTok, Facebook (default: social media)
- **Industry**: Coffee, tech, fashion, food, etc. (default: product)
- **Tone**: Cinematic, energetic, playful, luxury, etc. (default: professional)

Based on this analysis, it generates:

1. **7 nodes** covering the complete creative workflow:
   - Brief (uses the provided brief as-is)
   - Concept
   - Script & Narrative
   - Visual Direction
   - Shot List
   - Audio Design
   - Production Plan

2. **7 edges** connecting nodes in a logical workflow:
   ```
   Brief → Concept → Script → Shotlist → Production
             ↓         ↓
          Visual → Audio → Production
   ```

3. **Positions** optimized for canvas layout (300px spacing)

## Testing

### Run Tests
```bash
cd backend
node test-workflow-api.js
```

### View Detailed Output
```bash
node test-detailed.js
```

### Test Results
✅ All validation tests pass
✅ Generated workflows have correct structure
✅ Brief content is preserved in the brief node
✅ Content is customized based on brief analysis
✅ TypeScript compilation passes without errors

## Example Briefs

**Coffee Brand (Instagram):**
```
Create a 30 second cinematic Instagram advertisement for a premium coffee brand targeting young professionals.
```

**Tech Product (YouTube):**
```
Create a 60 second YouTube video showcasing a new smartwatch for fitness enthusiasts.
```

**Fashion Brand (TikTok):**
```
Create a 15 second energetic TikTok video for a luxury fashion brand.
```

## Future Enhancements

- [ ] AI integration for intelligent content generation
- [ ] Custom node type selection
- [ ] Workflow templates
- [ ] Database persistence
- [ ] User authentication
- [ ] Workflow versioning
- [ ] Collaborative editing

## API Usage Example

```javascript
const response = await fetch('http://localhost:3000/api/workflow/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    brief: 'Your creative brief here'
  })
});

const { workflow } = await response.json();
console.log(workflow.title);
console.log(`${workflow.nodes.length} nodes, ${workflow.edges.length} edges`);
```
