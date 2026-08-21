import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { v4 as uuidv4 } from 'uuid'
import { FieldCanvas } from './components/FieldCanvas'
import { TopToolbar } from './components/TopToolbar'
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTool, setActiveTool] = useState<ElementType | 'select'>('select')
  const [team, setTeam] = useState<Team>('home')
  const [showGrid, setShowGrid] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const field = presetToConfig(fieldPreset, { widthM: customWidth, heightM: customHeight })
  const readonly = embedParams.readonly
  const selectedElement =
    selectedIds.length === 1 ? (elements.find((el) => el.id === selectedIds[0]) ?? null) : null

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
    setSelectedIds([])
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
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)))
        setSelectedIds([])
        return
      }

      if (selectedElement?.type === 'arrow' && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        const delta = e.shiftKey ? -15 : 15
        const id = selectedElement.id
        setElements((prev) =>
          prev.map((el) =>
            el.id === id ? { ...el, rotation: (el.rotation + delta + 360) % 360 } : el,
          ),
        )
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [readonly, selectedIds, selectedElement])

  const handleAddElement = (type: ElementType, x: number, y: number) => {
    const playerCount = elements.filter((e) => e.type === 'player' && e.team === team).length
    const el = createElement(type, x, y, team, playerCount)
    setElements((prev) => [...prev, el])
    setSelectedIds([el.id])
  }

  const handleMoveElement = (id: string, x: number, y: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)))
  }

  const handleMoveElements = (updates: Array<{ id: string; x: number; y: number }>) => {
    const byId = new Map(updates.map((u) => [u.id, u]))
    setElements((prev) =>
      prev.map((el) => {
        const update = byId.get(el.id)
        return update ? { ...el, x: update.x, y: update.y } : el
      }),
    )
  }

  const handleRotateElement = (id: string, rotation: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, rotation } : el)))
  }

  const handleRotateDelta = (delta: number) => {
    if (!selectedElement || selectedElement.type !== 'arrow') return
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedElement.id ? { ...el, rotation: (el.rotation + delta + 360) % 360 } : el,
      ),
    )
  }

  const handleExport = () => {
    const stage = stageRef.current
    if (!stage) return
    const dataUrl = stageToPng(stage, 3)
    downloadDataUrl(dataUrl)
    showToast('Image PNG téléchargée')
    postToParent({ source: IFRAME_MESSAGE_SOURCE, type: 'ftt:export', payload: dataUrl })
  }

  const handlePresetChange = (preset: FieldPreset) => {
    setFieldPreset(preset)
    setElements([])
    setSelectedIds([])
  }

  return (
    <div className="app">
      <TopToolbar
        readonly={readonly}
        activeTool={activeTool}
        team={team}
        fieldPreset={fieldPreset}
        customWidth={customWidth}
        customHeight={customHeight}
        showGrid={showGrid}
        selectedElement={selectedElement}
        selectedCount={selectedIds.length}
        onToolChange={setActiveTool}
        onTeamChange={setTeam}
        onPresetChange={handlePresetChange}
        onCustomChange={(w, h) => {
          setCustomWidth(w)
          setCustomHeight(h)
        }}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onExport={handleExport}
        onDelete={() => {
          if (selectedIds.length === 0) return
          setElements((prev) => prev.filter((e) => !selectedIds.includes(e.id)))
          setSelectedIds([])
        }}
        onClear={() => {
          setElements([])
          setSelectedIds([])
        }}
        onRotate={handleRotateDelta}
      />

      <main className="canvas-area">
        <FieldCanvas
          field={field}
          elements={elements}
          selectedIds={selectedIds}
          activeTool={activeTool}
          readonly={readonly}
          showGrid={showGrid}
          onSelectIds={setSelectedIds}
          onAddElement={handleAddElement}
          onMoveElement={handleMoveElement}
          onMoveElements={handleMoveElements}
          onRotateElement={handleRotateElement}
          stageRef={stageRef}
        />
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
