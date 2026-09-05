import { useCallback, useState } from 'react'
import type { Workflow, WorkflowNode } from './types/workflow.types'
import BriefForm from './components/BriefForm'
import WorkflowCanvas from './components/WorkflowCanvas/WorkflowCanvas'
import InspectorPanel from './components/InspectorPanel/InspectorPanel'
import WorkflowChat from './components/WorkflowChat/WorkflowChat'
import './App.css'

function App() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [brief, setBrief] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const handleWorkflowGenerated = (wf: Workflow, sourceBrief: string) => {
    setWorkflow(wf)
    setBrief(sourceBrief)
    setSelectedNodeId(null)
  }

  const handleNodeSave = (nodeId: string, title: string, content: string) => {
    setWorkflow((prev) =>
      prev
        ? {
            ...prev,
            nodes: prev.nodes.map((n) =>
              n.id === nodeId ? { ...n, title, content } : n,
            ),
          }
        : prev,
    )
    setSelectedNodeId(null)
  }

  const handleNodeRegenerate = useCallback(
    async (nodeId: string): Promise<WorkflowNode> => {
      if (!workflow) {
        throw new Error('No workflow is loaded')
      }
      const node = workflow.nodes.find((n) => n.id === nodeId)
      if (!node) {
        throw new Error('Selected node not found')
      }

      const upstreamNodes = workflow.nodes.filter((n) =>
        workflow.edges.some((e) => e.target === nodeId && e.source === n.id),
      )
      const downstreamNodes = workflow.nodes.filter((n) =>
        workflow.edges.some((e) => e.source === nodeId && e.target === n.id),
      )

      const response = await fetch('/api/workflow/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief, node, upstreamNodes, downstreamNodes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to regenerate node')
      }

      const updatedNode: WorkflowNode = data.node

      // Replace only this node; every other node (including user edits) and all edges are preserved.
      setWorkflow((prev) =>
        prev
          ? {
              ...prev,
              nodes: prev.nodes.map((n) =>
                n.id === updatedNode.id ? updatedNode : n,
              ),
            }
          : prev,
      )

      return updatedNode
    },
    [workflow, brief],
  )

  const handleWorkflowEdit = useCallback(
    async (instruction: string): Promise<{ summary: string; nodeIds: string[] }> => {
      if (!workflow) {
        throw new Error('No workflow is loaded')
      }

      const response = await fetch('/api/workflow/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief, instruction, workflow }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to edit workflow')
      }

      const updatedNodes: WorkflowNode[] = data.nodes ?? []

      // Replace only the nodes the agent changed; everything else (including
      // the user's saved edits, edges, and positions) is preserved.
      setWorkflow((prev) =>
        prev
          ? {
              ...prev,
              nodes: prev.nodes.map((n) => {
                const updated = updatedNodes.find((u) => u.id === n.id)
                return updated ? updated : n
              }),
            }
          : prev,
      )

      return {
        summary: data.summary,
        nodeIds: updatedNodes.map((n) => n.id),
      }
    },
    [workflow, brief],
  )

  const selectedNode = workflow?.nodes.find((n) => n.id === selectedNodeId) ?? null

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path
                d="M24 3 41 13.5v21L24 45 7 34.5v-21L24 3Z"
                stroke="url(#logoGrad)"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="21" r="3.2" fill="url(#logoGrad)" />
              <circle cx="31" cy="14" r="3.2" fill="url(#logoGrad)" />
              <circle cx="34" cy="31" r="3.2" fill="url(#logoGrad)" />
              <circle cx="19" cy="34" r="3.2" fill="url(#logoGrad)" />
              <path
                d="M18 21l11.5-5M30.5 17l2.5 11m-2 2.5l-10.5 1.5"
                stroke="url(#logoGrad)"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="logoGrad" x1="7" y1="3" x2="41" y2="45" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8b6bff" />
                  <stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-text">HexFlow</span>
          </div>

          <div className="header-actions">
            <span className="beta-badge">Beta</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="hero-section">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-powered creative workflows
            </div>
            <h2 className="hero-title">
              Turn your creative brief
              <br />
              into a <span className="hero-title-accent">production workflow</span>
            </h2>
            <p className="hero-description">
              Describe your project in plain language and HexFlow generates a complete,
              production-ready workflow — every step from concept to delivery, mapped and connected.
            </p>
          </div>

          <div className="content-section">
            <BriefForm onWorkflowGenerated={handleWorkflowGenerated} />
          </div>
        </div>

        {workflow && (
          <div className="container workflow-section">
            <div className="workflow-layout">
              <WorkflowCanvas
                key={workflow.id}
                workflow={workflow}
                selectedNodeId={selectedNodeId}
                onNodeSelect={setSelectedNodeId}
              />
              <InspectorPanel
                key={selectedNode?.id ?? 'empty'}
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
                onSave={handleNodeSave}
                onRegenerate={handleNodeRegenerate}
              />
            </div>

            <WorkflowChat onEdit={handleWorkflowEdit} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="footer-text">HexFlow — AI Creative Workflow Builder</p>
        </div>
      </footer>
    </div>
  )
}

export default App