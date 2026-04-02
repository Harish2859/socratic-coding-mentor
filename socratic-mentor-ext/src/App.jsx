import { useState, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import { groq, GROQ_MODEL } from './config'

const theme = {
  bg: '#0d1117',
  bgElevated: '#161b22',
  border: '#30363d',
  accent: '#2ea043',
  accentMuted: '#1a3a27',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  warning: '#d29922',
  warningMuted: '#2a1f00',
}

const s = {
  container: (minimized) => ({
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
    width: minimized ? '44px' : '320px',
    height: minimized ? '44px' : '540px',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    transition: 'width 0.2s ease, height 0.2s ease',
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  }),
  header: {
    height: '44px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 12px',
    background: theme.bgElevated,
    borderBottom: `1px solid ${theme.border}`,
    cursor: 'grab', userSelect: 'none',
  },
  headerTitle: {
    fontSize: '12px', fontWeight: '600',
    color: theme.textSecondary, letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  headerBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: theme.textSecondary, fontSize: '16px', lineHeight: 1,
    padding: '2px 4px', borderRadius: '4px',
  },
  body: {
    padding: '12px', height: 'calc(100% - 44px)',
    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
    color: theme.textPrimary,
  },
  mirrorWrap: {
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px', overflow: 'hidden',
  },
  mirrorLabel: {
    fontSize: '10px', color: theme.textSecondary,
    padding: '6px 10px 4px',
    borderBottom: `1px solid ${theme.border}`,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  mirrorPre: {
    margin: 0, padding: '8px 10px',
    fontSize: '11px', lineHeight: '1.6',
    color: theme.textPrimary,
    maxHeight: '130px', overflowY: 'auto', overflowX: 'hidden',
    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
  btn: (color = theme.accent) => ({
    width: '100%', padding: '7px 12px',
    background: 'transparent',
    border: `1px solid ${color}`,
    borderRadius: '6px', cursor: 'pointer',
    color: color, fontSize: '12px', fontWeight: '500',
    letterSpacing: '0.02em', textAlign: 'left',
    transition: 'background 0.15s ease',
  }),
  stepCard: {
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px', padding: '10px 12px',
  },
  stepMeta: {
    fontSize: '10px', color: theme.textSecondary,
    marginBottom: '4px', letterSpacing: '0.04em',
  },
  stepComment: {
    fontSize: '12px', color: theme.textPrimary,
    lineHeight: '1.5', marginBottom: '8px',
  },
  varGrid: {
    display: 'flex', gap: '6px', flexWrap: 'wrap',
    marginBottom: '10px',
  },
  varCard: {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px', padding: '4px 8px',
    minWidth: '40px', transition: 'transform 0.15s ease',
  },
  varName: { fontSize: '9px', color: theme.textSecondary, marginBottom: '2px' },
  varVal: { fontSize: '13px', fontWeight: '600', color: theme.textPrimary },
  navRow: { display: 'flex', gap: '6px', alignItems: 'center' },
  navBtn: (disabled) => ({
    padding: '5px 10px', fontSize: '11px',
    background: 'transparent',
    border: `1px solid ${disabled ? theme.border : theme.accent}`,
    borderRadius: '4px', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? theme.textSecondary : theme.accent,
    opacity: disabled ? 0.4 : 1,
  }),
  counter: {
    marginLeft: 'auto', fontSize: '10px', color: theme.textSecondary,
  },
  callout: {
    borderLeft: `3px solid ${theme.warning}`,
    background: theme.warningMuted,
    borderRadius: '0 4px 4px 0',
    padding: '8px 10px',
    fontSize: '12px', color: theme.textPrimary,
    lineHeight: '1.5', fontStyle: 'italic',
  },
  divider: {
    height: '1px', background: theme.border, margin: '2px 0',
  },
}

async function askGroq(prompt) {
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })
  return res.choices[0].message.content
}

function MemoryBox({ vars }) {
  if (!vars || typeof vars !== 'object') return null
  const entries = Object.entries(vars)
  if (entries.length === 0) return null
  return (
    <div style={s.varGrid}>
      {entries.map(([k, v]) => (
        <div key={k} style={s.varCard}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={s.varName}>{k}</div>
          <div style={s.varVal}>{JSON.stringify(v)}</div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [isMinimized, setIsMinimized] = useState(false)
  const [code, setCode] = useState('')
  const [steps, setSteps] = useState([])
  const [stepIdx, setStepIdx] = useState(0)
  const [edgeCases, setEdgeCases] = useState([])
  const [loading, setLoading] = useState(null)
  const cacheRef = useRef({ code: '', steps: [], edgeCases: [] })
  const observerRef = useRef(null)
  const nodeRef = useRef(null)
  const codeRef = useRef(null)

  useEffect(() => {
    if (codeRef.current)
      codeRef.current.scrollTop = codeRef.current.scrollHeight
  }, [code])

  useEffect(() => {
    const line = steps[stepIdx]?.line
    if (line && codeRef.current)
      codeRef.current.scrollTo({ top: (line - 1) * 16.5, behavior: 'smooth' })
  }, [stepIdx, steps])

  useEffect(() => {
    const startObserving = () => {
      const target = document.querySelector('.monaco-editor')
      if (target) {
        observerRef.current = new MutationObserver(() => {
          const captured = Array.from(document.querySelectorAll('.view-line'))
            .map(l => l.innerText).join('\n')
          setCode(captured)
        })
        observerRef.current.observe(target, { childList: true, subtree: true, characterData: true })
      } else {
        setTimeout(startObserving, 1000)
      }
    }
    startObserving()
    return () => observerRef.current?.disconnect()
  }, [])

  async function handleDryRun() {
    if (!code.trim()) return
    if (cacheRef.current.code === code && cacheRef.current.steps.length > 0) {
      setSteps(cacheRef.current.steps); setStepIdx(0); return
    }
    setLoading('dryrun'); setSteps([]); setStepIdx(0)
    try {
      const raw = await askGroq(`You are tracing code for a beginner. The code may have syntax errors or gibberish lines.
If a line is invalid, include it as a step with comment "Interpreter is confused here — what did you mean to write?"
Trace up to 6 steps using a small example input.
Return a JSON object: {"steps":[{"step":1,"line":2,"vars":{"i":0},"comment":"short note"}]}
Code:\n${code}`)
      const parsed = JSON.parse(raw)
      const result = parsed.steps ?? parsed
      setSteps(result)
      cacheRef.current = { ...cacheRef.current, code, steps: result }
    } catch {
      setSteps([{ step: 1, line: '?', vars: {}, comment: 'Could not parse response.' }])
    }
    setLoading(null)
  }

  async function handleEdgeCases() {
    if (!code.trim()) return
    if (cacheRef.current.code === code && cacheRef.current.edgeCases.length > 0) {
      setEdgeCases(cacheRef.current.edgeCases); return
    }
    setLoading('edge'); setEdgeCases([])
    try {
      const raw = await askGroq(`You are a Socratic coding mentor. Identify up to 3 edge cases the coder may have missed.
For each, ask ONE short Socratic question (don't give the answer).
Return a JSON object: {"questions":["question1","question2"]}
Code:\n${code}`)
      const parsed = JSON.parse(raw)
      setEdgeCases(parsed.questions ?? parsed)
      cacheRef.current = { ...cacheRef.current, code, edgeCases: parsed.questions ?? parsed }
    } catch {
      setEdgeCases(['Could not analyze edge cases.'])
    }
    setLoading(null)
  }

  const currentStep = steps[stepIdx]

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="body">
      <div ref={nodeRef} style={s.container(isMinimized)}>

        <div className="drag-handle" style={s.header}>
          {!isMinimized && <span style={s.headerTitle}>Socratic Mentor</span>}
          <button style={s.headerBtn}
            onClick={() => setIsMinimized(m => !m)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '⊞' : '−'}
          </button>
        </div>

        {!isMinimized && (
          <div style={s.body}>

            {/* Live Mirror */}
            <div style={s.mirrorWrap}>
              <div style={s.mirrorLabel}>live mirror</div>
              <pre ref={codeRef} style={s.mirrorPre}>
                {steps.length > 0
                  ? code.split('\n').map((line, i) => (
                    <span key={i} style={{
                      display: 'block',
                      background: currentStep?.line === i + 1 ? theme.accentMuted : 'transparent',
                      borderLeft: currentStep?.line === i + 1
                        ? `2px solid ${theme.accent}` : '2px solid transparent',
                      paddingLeft: '6px',
                    }}>{line || ' '}</span>
                  ))
                  : (code || '// start typing...')
                }
              </pre>
            </div>

            <div style={s.divider} />

            {/* Dry Run */}
            <button style={s.btn()} onClick={handleDryRun} disabled={!!loading}
              onMouseEnter={e => !loading && (e.target.style.background = theme.accentMuted)}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              {loading === 'dryrun' ? '⟳  tracing...' : '▶  dry run'}
            </button>

            {steps.length > 0 && (
              <div style={s.stepCard}>
                <div style={s.stepMeta}>step {currentStep.step} · line {currentStep.line}</div>
                <div style={s.stepComment}>{currentStep.comment}</div>
                <MemoryBox vars={currentStep.vars} />
                <div style={s.navRow}>
                  <button style={s.navBtn(stepIdx === 0)}
                    onClick={() => setStepIdx(i => Math.max(0, i - 1))}
                    disabled={stepIdx === 0}>← back</button>
                  <button style={s.navBtn(stepIdx === steps.length - 1)}
                    onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}
                    disabled={stepIdx === steps.length - 1}>next →</button>
                  <span style={s.counter}>{stepIdx + 1} / {steps.length}</span>
                </div>
              </div>
            )}

            <div style={s.divider} />

            {/* Edge Cases */}
            <button style={s.btn(theme.warning)} onClick={handleEdgeCases} disabled={!!loading}
              onMouseEnter={e => !loading && (e.target.style.background = theme.warningMuted)}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              {loading === 'edge' ? '⟳  analyzing...' : '⚠  edge cases'}
            </button>

            {edgeCases.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {edgeCases.map((q, i) => (
                  <div key={i} style={s.callout}>"{q}"</div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </Draggable>
  )
}
