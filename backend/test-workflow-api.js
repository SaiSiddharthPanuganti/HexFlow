/**
 * Test script for workflow generation API
 * Run with: node test-workflow-api.js
 */

const testCases = [
  {
    name: 'Valid request - Coffee brand',
    body: {
      brief: 'Create a 30 second cinematic Instagram advertisement for a premium coffee brand targeting young professionals.'
    },
    expectedStatus: 200
  },
  {
    name: 'Valid request - Tech product',
    body: {
      brief: 'Create a 60 second YouTube video showcasing a new smartwatch for fitness enthusiasts.'
    },
    expectedStatus: 200
  },
  {
    name: 'Invalid request - Empty brief',
    body: {
      brief: ''
    },
    expectedStatus: 400
  },
  {
    name: 'Invalid request - Missing brief',
    body: {},
    expectedStatus: 400
  },
  {
    name: 'Invalid request - Whitespace only',
    body: {
      brief: '   '
    },
    expectedStatus: 400
  }
];

async function testEndpoint(testCase) {
  console.log(`\n📝 Testing: ${testCase.name}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/workflow/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.body)
    });

    const data = await response.json();
    const status = response.status;

    if (status === testCase.expectedStatus) {
      console.log(`✅ Status: ${status} (Expected: ${testCase.expectedStatus})`);
      
      if (status === 200) {
        console.log(`   Workflow ID: ${data.workflow.id}`);
        console.log(`   Title: ${data.workflow.title}`);
        console.log(`   Nodes: ${data.workflow.nodes.length}`);
        console.log(`   Edges: ${data.workflow.edges.length}`);
      } else {
        console.log(`   Error: ${data.error}`);
        console.log(`   Message: ${data.message}`);
      }
    } else {
      console.log(`❌ Status: ${status} (Expected: ${testCase.expectedStatus})`);
      console.log(`   Response:`, data);
    }
  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting workflow API tests...\n');
  console.log('=' .repeat(60));
  
  for (const testCase of testCases) {
    await testEndpoint(testCase);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Tests complete!');
}

runTests();
