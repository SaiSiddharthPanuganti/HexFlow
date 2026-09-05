/**
 * Detailed test to show full workflow structure
 */

async function testDetailed() {
  const response = await fetch('http://localhost:3000/api/workflow/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brief: 'Create a 30 second cinematic Instagram advertisement for a premium coffee brand targeting young professionals.'
    })
  });

  const data = await response.json();
  
  console.log('\n📦 Full Workflow Response:\n');
  console.log(JSON.stringify(data.workflow, null, 2));
}

testDetailed();
