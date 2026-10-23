import { useCallback, useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import type { Workflow, WorkflowNode } from './types/workflow.types'
import BriefForm from './components/BriefForm'
import WorkflowCanvas from './components/WorkflowCanvas/WorkflowCanvas'
import InspectorPanel from './components/InspectorPanel/InspectorPanel'
import WorkflowChat from './components/WorkflowChat/WorkflowChat'
import { apiUrl } from './lib/api'
import { getNodeLabel } from './components/WorkflowCanvas/nodeStyles'
import { getCurrentSession, signIn, signOut, signUp, supabaseConfigured, cloudLoadLatest, cloudSaveWorkflow, type AuthSession } from './lib/supabase'
import './App.css'

function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [cloudBusy, setCloudBusy] = useState(false)

  useEffect(() => {
    let active = true
    getCurrentSession().then((current) => {
      if (active) { setSession(current); setAuthReady(true) }
    }).catch(() => { if (active) setAuthReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true
    setCloudBusy(true)
    cloudLoadLatest(session).then((saved) => {
      if (!active) return
      if (saved) {
        setWorkflow(saved.workflow); setBrief(saved.brief); setSavedAt(Date.parse(saved.updatedAt))
        localStorage.setItem('hexflow-workflow', JSON.stringify(saved.workflow))
        localStorage.setItem('hexflow-brief', saved.brief)
      } else {
        setWorkflow(null); setBrief(''); setSavedAt(null)
      }
    }).catch((error: unknown) => {
      if (active) setNotice(error instanceof Error ? error.message : 'Could not load cloud workflow')
    }).finally(() => { if (active) setCloudBusy(false) })
    return () => { active = false }
  }, [session])

  const handleAuth = async (event: import('react').FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true); setAuthError(null)
    try {
      const next = authMode === 'signin' ? await signIn(authEmail, authPassword) : await signUp(authEmail, authPassword)
      if (next) setSession(next)
      else setAuthError('Check your email to confirm your account, then sign in.')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed')
    } finally { setAuthBusy(false) }
  }
  const [workflow, setWorkflow] = useState<Workflow | null>(() => {
    try {
      const saved = localStorage.getItem('hexflow-workflow')
      return saved ? (JSON.parse(saved) as Workflow) : null
    } catch {
      return null
    }
  })
  const [brief, setBrief] = useState(() => localStorage.getItem('hexflow-brief') ?? '')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [past, setPast] = useState<Workflow[]>([])
  const [future, setFuture] = useState<Workflow[]>([])
  const [savedAt, setSavedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem('hexflow-saved-at')
    return saved ? Number(saved) : null
  })
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const commitWorkflow = useCallback((next: Workflow | null) => {
    setWorkflow((current) => {
      if (current && next && JSON.stringify(current) !== JSON.stringify(next)) {
        setPast((history) => [...history, current].slice(-30))
        setFuture([])
      }
      return next
    })
  }, [])

  const handleWorkflowGenerated = (wf: Workflow, sourceBrief: string) => {
    setWorkflow(wf)
    setBrief(sourceBrief)
    setSelectedNodeId(null)
    setPast([])
    setFuture([])
    setSavedAt(null)
  }

  const handleNodeSave = (nodeId: string, title: string, content: string) => {
    if (!workflow) return
    commitWorkflow({
      ...workflow,
      nodes: workflow.nodes.map((n) =>
        n.id === nodeId ? { ...n, title, content } : n,
      ),
    })
    setSelectedNodeId(null)
  }

  const handleNodePositionChange = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!workflow) return
    const node = workflow.nodes.find((item) => item.id === nodeId)
    if (!node || (node.position.x === position.x && node.position.y === position.y)) return
    commitWorkflow({
      ...workflow,
      nodes: workflow.nodes.map((item) => item.id === nodeId ? { ...item, position } : item),
    })
  }, [commitWorkflow, workflow])

  const undo = () => {
    const previous = past[past.length - 1]
    if (!workflow || !previous) return
    setPast((history) => history.slice(0, -1))
    setFuture((history) => [workflow, ...history].slice(0, 30))
    setWorkflow(previous)
    setSelectedNodeId(null)
  }

  const redo = () => {
    const next = future[0]
    if (!workflow || !next) return
    setFuture((history) => history.slice(1))
    setPast((history) => [...history, workflow].slice(-30))
    setWorkflow(next)
    setSelectedNodeId(null)
  }

  const saveWorkflow = async () => {
    if (!workflow || !session) return
    setCloudBusy(true)
    try {
      await cloudSaveWorkflow(session, workflow, brief)
      const timestamp = Date.now()
      localStorage.setItem('hexflow-workflow', JSON.stringify(workflow))
      localStorage.setItem('hexflow-brief', brief)
      localStorage.setItem('hexflow-saved-at', String(timestamp))
      setSavedAt(timestamp)
      setNotice('Workflow saved to your account')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Cloud save failed')
    } finally { setCloudBusy(false) }
  }

  const exportWorkflow = () => {
    if (!workflow) return
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflow.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'hexflow-workflow'}.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Workflow exported')
  }

  const shareWorkflow = async () => {
    if (!workflow) return
    const shareData = { title: workflow.title, text: workflow.description, url: window.location.href }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setNotice('Workspace link copied')
      }
    } catch {
      // Share dialogs can be dismissed without an error state in the UI.
    }
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

      const response = await fetch(apiUrl('/api/workflow/regenerate'), {
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
      if (workflow) {
        commitWorkflow({
          ...workflow,
          nodes: workflow.nodes.map((n) => n.id === updatedNode.id ? updatedNode : n),
        })
      }

      return updatedNode
    },
    [commitWorkflow, workflow, brief],
  )

  const handleWorkflowEdit = useCallback(
    async (instruction: string): Promise<{ summary: string; nodeLabels: string[] }> => {
      if (!workflow) {
        throw new Error('No workflow is loaded')
      }

      const response = await fetch(apiUrl('/api/workflow/edit'), {
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

      const nextWorkflow: Workflow = data.workflow
      const previousNodes = new Map(workflow.nodes.map((node) => [node.id, node]))
      const nextNodes = new Map(nextWorkflow.nodes.map((node) => [node.id, node]))
      const nodeLabels: string[] = []

      nextWorkflow.nodes.forEach((node) => {
        const previous = previousNodes.get(node.id)
        if (!previous) {
          nodeLabels.push(`Added ${getNodeLabel(node.type)}`)
        } else if (previous.title !== node.title || previous.content !== node.content) {
          nodeLabels.push(`Updated ${getNodeLabel(node.type)}`)
        }
      })
      workflow.nodes.forEach((node) => {
        if (!nextNodes.has(node.id)) nodeLabels.push(`Removed ${getNodeLabel(node.type)}`)
      })

      commitWorkflow(nextWorkflow)

      return {
        summary: data.summary,
        nodeLabels,
      }
    },
    [commitWorkflow, workflow, brief],
  )

  const selectedNode = workflow?.nodes.find((n) => n.id === selectedNodeId) ?? null

  if (!authReady) return <main className="auth-screen"><div className="auth-card"><h1>HexFlow</h1><p>Loading your workspace…</p></div></main>

  if (!supabaseConfigured) return <main className="auth-screen"><div className="auth-card"><h1>Connect Supabase</h1><p>Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment and Vercel settings.</p></div></main>

  if (!session) return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleAuth}>
        <h1>{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p>Sign in to access your workflows across devices.</p>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" autoComplete="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} />
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" minLength={8} autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} />
        {authError && <p className="auth-error" role="alert">{authError}</p>}
        <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}</button>
        <button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(null) }}>{authMode === 'signin' ? 'New to HexFlow? Create an account' : 'Already have an account? Sign in'}</button>
      </form>
    </main>
  )

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
            {workflow && (
              <>
                <div className="history-actions" aria-label="Workflow history">
                  <button type="button" className="icon-button" onClick={undo} disabled={!past.length} aria-label="Undo last change" title="Undo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-1" /></svg>
                  </button>
                  <button type="button" className="icon-button" onClick={redo} disabled={!future.length} aria-label="Redo last change" title="Redo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h1" /></svg>
                  </button>
                </div>
                <button type="button" className="header-button" onClick={saveWorkflow} disabled={cloudBusy}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></svg>
                  Save
                </button>
                <button type="button" className="header-button header-button-icon" onClick={exportWorkflow} aria-label="Export workflow" title="Export workflow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
                </button>
                <button type="button" className="header-button header-button-icon" onClick={shareWorkflow} aria-label="Share workflow" title="Share workflow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6m-7.6 7 7.6 4.6" /></svg>
                </button>
                <span className="save-status" aria-live="polite">{cloudBusy ? 'Syncing…' : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Unsaved'}</span>
              </>
            )}
            <span className="save-status">{session.user.email}</span>
            <button type="button" className="header-button" onClick={() => { void signOut().finally(() => { setSession(null); setWorkflow(null); setBrief('') }) }}>Sign out</button>
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
                onNodePositionChange={handleNodePositionChange}
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

      {notice && <div className="app-notice" role="status">{notice}</div>}

      <footer className="app-footer">
        <div className="container">
          <p className="footer-text">HexFlow — AI Creative Workflow Builder</p>
        </div>
      </footer>
      <Analytics />
    </div>
  )
}

export default App