import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { v4 as uuidv4 } from 'uuid'
import { FieldCanvas } from './components/FieldCanvas'
import { FieldSettings } from './components/FieldSettings'
import { ElementPalette } from './components/ElementPalette'
import { Toolbar } from './components/Toolbar'
import type { AppState, ElementType, FieldElement, FieldPreset, Team } from './types'
import { presetToConfig } from './utils/fieldDimensions'
import { downloadDataUrl, stageToPng } from './utils/exportImage'
import {
  IFRAME_MESSAGE_SOURCE,
  parseEmbedParams,
  postToParent,
  type IframeRequest,
} from './utils/iframeBridge'
import './App.css'

const DEFAULT_STATE: AppState = {
  field: presetToConfig('half'),
  elements: [],
}

function createElement(type: ElementType, x: number, y: number, team: Team, playerCount: number): FieldElement {
  const base: FieldElement = {
    id: uuidv4(),
    type,
    x,
    y,
    rotation: 0,
  }

  if (type === 'player') {
    return { ...base, team, number: playerCount + 1 }
  }
  if (type === 'goalkeeper') {
    return { ...base, team }
  }
  return base
}

function App() {
  const stageRef = useRef<Konva.Stage>(null)
  const embedParams = parseEmbedParams(window.location.search)
  const [fieldPreset, setFieldPreset] = useState<FieldPreset>(DEFAULT_STATE.field.preset)
  const [customWidth, setCustomWidth] = useState(40)
  const [customHeight, setCustomHeight] = useState(30)
  const [elements, setElements] = useState<FieldElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<ElementType | 'select'>('select')
  const [team, setTeam] = useState<Team>('home')
  const [showGrid, setShowGrid] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const field = presetToConfig(fieldPreset, { widthM: customWidth, heightM: customHeight })
  const readonly = embedParams.readonly

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const getState = useCallback((): AppState => ({ field, elements }), [field, elements])

  const loadState = useCallback((state: AppState) => {
    setFieldPreset(state.field.preset)
    if (state.field.preset === 'custom') {
      setCustomWidth(state.field.widthM)
      setCustomHeight(state.field.heightM)
    }
    setElements(state.elements)
    setSelectedId(null)
  }, [])

  useEffect(() => {
    postToParent({ source: IFRAME_MESSAGE_SOURCE, type: 'ftt:ready' })
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent<IframeRequest>) => {
      if (!event.data || typeof event.data !== 'object') return
      const { type } = event.data
      if (type === 'ftt:getState') {
        postToParent({ source: IFRAME_MESSAGE_SOURCE, type: 'ftt:state', payload: getState() })
      } else if (type === 'ftt:setState' && 'payload' in event.data) {
        loadState(event.data.payload)
      } else if (type === 'ftt:export') {
        const stage = stageRef.current
        if (stage) {
          const dataUrl = stageToPng(stage)
          postToParent({ source: IFRAME_MESSAGE_SOURCE, type: 'ftt:export', payload: dataUrl })
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [getState, loadState])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (readonly) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setElements((prev) => prev.filter((el) => el.id !== selectedId))
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [readonly, selectedId])

  const handleAddElement = (type: ElementType, x: number, y: number) => {
    const playerCount = elements.filter((e) => e.type === 'player' && e.team === team).length
    const el = createElement(type, x, y, team, playerCount)
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
    setActiveTool('select')
  }

  const handleMoveElement = (id: string, x: number, y: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)))
  }

  const handleExport = () => {
    const stage = stageRef.current
    if (!stage) return
    const dataUrl = stageToPng(stage, 3)
    downloadDataUrl(dataUrl)
    showToast('Image PNG téléchargée')
    postToParent({ source: IFRAME_MESSAGE_SOURCE, type: 'ftt:export', payload: dataUrl })
  }

  const handleCopyEmbed = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?embed=1`
    const code = `<iframe src="${url}" width="960" height="720" frameborder="0" allow="clipboard-write" title="Créateur de séance foot"></iframe>`
    await navigator.clipboard.writeText(code)
    showToast('Code iframe copié')
  }

  const handlePresetChange = (preset: FieldPreset) => {
    setFieldPreset(preset)
    setElements([])
    setSelectedId(null)
  }

  return (
    <div className={`app ${embedParams.embed ? 'embed' : ''}`}>
      {!embedParams.embed && (
        <header className="app-header">
          <div>
            <h1>Football Train Tool</h1>
            <p>Créateur de visuel de séance — vue 2D du dessus</p>
          </div>
        </header>
      )}

      <main className="app-layout">
        <aside className="sidebar">
          <FieldSettings
            preset={fieldPreset}
            customWidth={customWidth}
            customHeight={customHeight}
            readonly={readonly}
            onPresetChange={handlePresetChange}
            onCustomChange={(w, h) => {
              setCustomWidth(w)
              setCustomHeight(h)
            }}
          />
          <ElementPalette
            activeTool={activeTool}
            team={team}
            readonly={readonly}
            onToolChange={setActiveTool}
            onTeamChange={setTeam}
          />
          <Toolbar
            readonly={readonly}
            showGrid={showGrid}
            selectedCount={selectedId ? 1 : 0}
            onDelete={() => {
              if (!selectedId) return
              setElements((prev) => prev.filter((e) => e.id !== selectedId))
              setSelectedId(null)
            }}
            onClear={() => {
              setElements([])
              setSelectedId(null)
            }}
            onExport={handleExport}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onCopyEmbedCode={handleCopyEmbed}
          />
        </aside>

        <section className="canvas-area">
          <FieldCanvas
            field={field}
            elements={elements}
            selectedId={selectedId}
            activeTool={activeTool}
            readonly={readonly}
            showGrid={showGrid}
            onSelect={setSelectedId}
            onAddElement={handleAddElement}
            onMoveElement={handleMoveElement}
            stageRef={stageRef}
          />
        </section>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
