import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGenerateRequest,
  isValidNode,
  validateRegenerateRequest,
  isValidWorkflow,
  validateEditRequest,
} from '../src/controllers/workflowController';

const validNode = {
  id: 'node-1',
  type: 'concept',
  title: 'Creative concept',
  content: 'A concise concept description',
  position: { x: 0, y: 0 },
};

const validWorkflow = {
  id: 'workflow-1',
  title: 'Campaign workflow',
  description: 'A test workflow',
  nodes: [validNode],
  edges: [],
};

test('generate request accepts a non-empty brief', () => {
  assert.equal(validateGenerateRequest({ brief: 'Create a short film' }), true);
});

test('generate request rejects empty, missing, and oversized briefs', () => {
  assert.equal(validateGenerateRequest({ brief: '   ' }), false);
  assert.equal(validateGenerateRequest({}), false);
  assert.equal(validateGenerateRequest({ brief: 'x'.repeat(10_001) }), false);
});

test('node validation accepts supported node types and rejects invalid shapes', () => {
  assert.equal(isValidNode(validNode), true);
  assert.equal(isValidNode({ ...validNode, type: 'unknown' }), false);
  assert.equal(isValidNode({ ...validNode, title: 'x'.repeat(301) }), false);
  assert.equal(isValidNode({ ...validNode, content: 'x'.repeat(10_001) }), false);
  assert.equal(isValidNode({ ...validNode, position: { x: '0', y: 0 } }), false);
});

test('regeneration request rejects oversized context arrays', () => {
  assert.equal(validateRegenerateRequest({
    brief: 'Create a short film',
    node: validNode,
    upstreamNodes: [],
    downstreamNodes: [],
  }), true);

  assert.equal(validateRegenerateRequest({
    brief: 'Create a short film',
    node: validNode,
    upstreamNodes: Array.from({ length: 101 }, (_, i) => ({ ...validNode, id: `up-${i}` })),
    downstreamNodes: [],
  }), false);
});

test('workflow validation enforces node/edge limits and valid edge endpoints', () => {
  assert.equal(isValidWorkflow(validWorkflow), true);
  assert.equal(isValidWorkflow({
    ...validWorkflow,
    edges: [{ id: 'edge-1', source: 'missing', target: 'node-1' }],
  }), false);
  assert.equal(isValidWorkflow({
    ...validWorkflow,
    nodes: Array.from({ length: 101 }, (_, i) => ({ ...validNode, id: `node-${i}` })),
  }), false);
  assert.equal(isValidWorkflow({
    ...validWorkflow,
    edges: Array.from({ length: 201 }, (_, i) => ({ id: `edge-${i}`, source: 'node-1', target: 'node-1' })),
  }), false);
});

test('edit request rejects empty or oversized instructions', () => {
  assert.equal(validateEditRequest({
    brief: 'Create a short film',
    instruction: 'Make the ending more hopeful',
    workflow: validWorkflow,
  }), true);
  assert.equal(validateEditRequest({
    brief: 'Create a short film',
    instruction: ' ',
    workflow: validWorkflow,
  }), false);
  assert.equal(validateEditRequest({
    brief: 'Create a short film',
    instruction: 'x'.repeat(2_001),
    workflow: validWorkflow,
  }), false);
});
