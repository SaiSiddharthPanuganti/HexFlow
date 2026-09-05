# HexFlow Workflow Data Model

## Overview

This document describes the workflow data model implemented for HexFlow. The model is designed to be compatible with @xyflow/react (React Flow) for future UI integration.

## Files Created

### Backend
- `backend/src/types/workflow.types.ts` - TypeScript type definitions
- `backend/src/data/mockWorkflow.ts` - Mock workflow data for development

### Frontend
- `frontend/src/types/workflow.types.ts` - TypeScript type definitions (identical to backend)
- `frontend/src/data/mockWorkflow.ts` - Mock workflow data for development (identical to backend)

## Schema Structure

### Workflow
The top-level structure representing a complete creative workflow.

```typescript
interface Workflow {
  id: string;              // Unique workflow identifier
  title: string;           // Workflow title
  description: string;     // Detailed workflow description
  nodes: WorkflowNode[];   // Array of workflow nodes
  edges: WorkflowEdge[];   // Array of connections between nodes
}
```

### WorkflowNode
Represents a step in the creative process.

```typescript
interface WorkflowNode {
  id: string;              // Unique node identifier
  type: NodeType;          // Type of creative step
  title: string;           // Node title
  content: string;         // Detailed content/description
  position: NodePosition;  // Position on canvas (x, y coordinates)
}
```

### NodeType
Supported node types for the MVP:

- **brief**: Creative brief and project requirements
- **concept**: High-level creative concept and vision
- **script**: Script, narrative, and storyboard
- **visual**: Visual direction, cinematography, and style
- **shotlist**: Detailed shot-by-shot breakdown
- **audio**: Audio design, music, and sound effects
- **production**: Production schedule and logistics

### WorkflowEdge
Represents a connection between two nodes.

```typescript
interface WorkflowEdge {
  id: string;     // Unique edge identifier
  source: string; // Source node ID
  target: string; // Target node ID
}
```

### NodePosition
Canvas position for node placement.

```typescript
interface NodePosition {
  x: number;  // Horizontal position
  y: number;  // Vertical position
}
```

## React Flow Compatibility

The schema is designed to be easily converted to React Flow format:

- `WorkflowNode` can be mapped directly to React Flow nodes by adding a `data` property
- `WorkflowEdge` matches React Flow edge structure
- `NodePosition` aligns with React Flow's positioning system
- Node `type` can be used for custom React Flow node components

## Mock Workflow Example

A complete example workflow is provided: **Product Launch Video Campaign**

This workflow demonstrates:
- 7 nodes covering all supported node types
- 7 edges showing workflow progression
- Realistic content for a video production workflow
- Logical positioning for canvas layout

### Workflow Flow
```
Brief → Concept → Script → Shotlist → Production
           ↓         ↓
        Visual → Audio → Production
```

## Type Safety

The schema includes:
- Strong TypeScript typing for all interfaces
- Type guard function `isValidNodeType()` for runtime validation
- Exported types for use across the application

## Usage

### Importing Types
```typescript
import type { Workflow, WorkflowNode, WorkflowEdge, NodeType } from './types/workflow.types';
```

### Importing Mock Data
```typescript
import { mockWorkflow } from './data/mockWorkflow';
```

## Verification

✅ Backend TypeScript compilation passes
✅ Frontend TypeScript compilation passes
✅ Types are consistent between frontend and backend
✅ Mock data validates against the schema

## Next Steps

- Install @xyflow/react
- Create conversion utilities from Workflow to React Flow nodes/edges
- Implement workflow canvas component
- Add workflow API endpoints
- Implement workflow CRUD operations