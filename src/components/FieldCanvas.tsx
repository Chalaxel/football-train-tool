import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Transformer, Rect } from 'react-konva'
import type Konva from 'konva'
import type { ElementType, FieldConfig, FieldElement } from '../types'
import { FieldMarkings, FieldGrid } from './FieldMarkings'
import { DraggableElement } from './DraggableElement'
import { fieldAspectRatio } from '../utils/fieldDimensions'

interface FieldCanvasProps {
  field: FieldConfig
  elements: FieldElement[]
  selectedIds: string[]
  activeTool: ElementType | 'select' | null
  readonly: boolean
  showGrid: boolean
  onSelectIds: (ids: string[]) => void
  onAddElement: (type: ElementType, x: number, y: number) => void
  onMoveElement: (id: string, x: number, y: number) => void
  onMoveElements: (updates: Array<{ id: string; x: number; y: number }>) => void
  onRotateElement: (id: string, rotation: number) => void
  stageRef?: React.RefObject<Konva.Stage | null>
}

const MARQUEE_THRESHOLD = 4

function isBackgroundTarget(target: Konva.Node, stage: Konva.Stage): boolean {
  if (target === stage) return true
  const cls = target.getClassName()
  return cls === 'Rect' || cls === 'Line'
}

function idsInRect(
  elements: FieldElement[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fieldWidth: number,
  fieldHeight: number,
): string[] {
  const left = Math.min(x1, x2) / fieldWidth
  const right = Math.max(x1, x2) / fieldWidth
  const top = Math.min(y1, y2) / fieldHeight
  const bottom = Math.max(y1, y2) / fieldHeight

  return elements
    .filter((el) => el.x >= left && el.x <= right && el.y >= top && el.y <= bottom)
    .map((el) => el.id)
}

export function FieldCanvas({
  field,
  elements,
  selectedIds,
  activeTool,
  readonly,
  showGrid,
  onSelectIds,
  onAddElement,
  onMoveElement,
  onMoveElements,
  onRotateElement,
  stageRef: externalRef,
}: FieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const internalRef = useRef<Konva.Stage>(null)
  const stageRef = externalRef ?? internalRef
  const transformerRef = useRef<Konva.Transformer>(null)
  const elementRefs = useRef<Map<string, Konva.Group>>(new Map())
  const multiDragRef = useRef<{ anchorId: string; initial: Map<string, { x: number; y: number }> } | null>(null)
  const marqueeRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null)
  const [size, setSize] = useState({ width: 800, height: 520 })
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null
  const selectedElement = elements.find((el) => el.id === singleSelectedId)

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return
      const { clientWidth, clientHeight } = containerRef.current
      const ratio = fieldAspectRatio(field)
      let width = clientWidth
      let height = width / ratio
      if (height > clientHeight) {
        height = clientHeight
        width = height * ratio
      }
      setSize({ width, height })
    }
    update()
    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [field])

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return

    if (selectedElement?.type === 'arrow' && !readonly && singleSelectedId) {
      const node = elementRefs.current.get(singleSelectedId)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
        return
      }
    }
    tr.nodes([])
    tr.getLayer()?.batchDraw()
  }, [selectedElement, singleSelectedId, readonly, elements])

  const handleTransformEnd = useCallback(() => {
    if (!singleSelectedId) return
    const node = elementRefs.current.get(singleSelectedId)
    if (!node) return
    const rotation = ((node.rotation() % 360) + 360) % 360
    onRotateElement(singleSelectedId, rotation)
  }, [singleSelectedId, onRotateElement])

  const handleElementSelect = useCallback(
    (id: string) => {
      if (readonly || activeTool !== 'select') return
      onSelectIds([id])
    },
    [activeTool, onSelectIds, readonly],
  )

  const handleElementDragStart = useCallback(
    (id: string) => {
      if (readonly || selectedIds.length <= 1 || !selectedIds.includes(id)) {
        multiDragRef.current = null
        return
      }
      const initial = new Map<string, { x: number; y: number }>()
      for (const sid of selectedIds) {
        const node = elementRefs.current.get(sid)
        if (node) initial.set(sid, { x: node.x(), y: node.y() })
      }
      multiDragRef.current = { anchorId: id, initial }
    },
    [readonly, selectedIds],
  )

  const handleElementDragMove = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const drag = multiDragRef.current
      if (!drag || drag.anchorId !== id) return
      const anchorInitial = drag.initial.get(id)
      if (!anchorInitial) return
      const dx = e.target.x() - anchorInitial.x
      const dy = e.target.y() - anchorInitial.y
      for (const sid of selectedIds) {
        if (sid === id) continue
        const node = elementRefs.current.get(sid)
        const init = drag.initial.get(sid)
        if (node && init) {
          node.x(init.x + dx)
          node.y(init.y + dy)
        }
      }
    },
    [selectedIds],
  )

  const handleElementDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const drag = multiDragRef.current
      if (drag && selectedIds.length > 1 && selectedIds.includes(id)) {
        const updates = selectedIds.map((sid) => {
          const node = elementRefs.current.get(sid)
          if (!node) return { id: sid, x: 0, y: 0 }
          return {
            id: sid,
            x: Math.min(1, Math.max(0, node.x() / size.width)),
            y: Math.min(1, Math.max(0, node.y() / size.height)),
          }
        })
        onMoveElements(updates)
        multiDragRef.current = null
        return
      }
      multiDragRef.current = null
      onMoveElement(id, x, y)
    },
    [onMoveElement, onMoveElements, selectedIds, size.height, size.width],
  )

  const finishMarquee = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      const dx = Math.abs(endX - startX)
      const dy = Math.abs(endY - startY)
      if (dx < MARQUEE_THRESHOLD && dy < MARQUEE_THRESHOLD) {
        onSelectIds([])
      } else {
        onSelectIds(idsInRect(elements, startX, startY, endX, endY, size.width, size.height))
      }
      setMarquee(null)
      marqueeRef.current = null
    },
    [elements, onSelectIds, size.height, size.width],
  )

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (readonly) return
      const stage = stageRef.current
      if (!stage || activeTool !== 'select') return
      if (!isBackgroundTarget(e.target, stage)) return

      const pos = stage.getPointerPosition()
      if (!pos) return
      marqueeRef.current = { startX: pos.x, startY: pos.y, active: true }
      setMarquee({ x: pos.x, y: pos.y, width: 0, height: 0 })
    },
    [activeTool, readonly, stageRef],
  )

  const handleStageMouseMove = useCallback(() => {
      const m = marqueeRef.current
      if (!m?.active) return
      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getPointerPosition()
      if (!pos) return
      setMarquee({
        x: Math.min(m.startX, pos.x),
        y: Math.min(m.startY, pos.y),
        width: Math.abs(pos.x - m.startX),
        height: Math.abs(pos.y - m.startY),
      })
    },
    [stageRef],
  )

  const handleStageMouseUp = useCallback(() => {
      const m = marqueeRef.current
      if (!m?.active) return
      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getPointerPosition()
      if (!pos) {
        setMarquee(null)
        marqueeRef.current = null
        return
      }
      finishMarquee(m.startX, m.startY, pos.x, pos.y)
    },
    [finishMarquee, stageRef],
  )

  const handleStageClick = useCallback(
    (e: { target: Konva.Node; evt: MouseEvent | TouchEvent }) => {
      if (readonly) return
      if (marqueeRef.current) return
      const stage = stageRef.current
      if (!stage) return

      if (isBackgroundTarget(e.target, stage) && activeTool && activeTool !== 'select') {
        const pos = stage.getPointerPosition()
        if (!pos) return
        const nx = Math.min(1, Math.max(0, pos.x / size.width))
        const ny = Math.min(1, Math.max(0, pos.y / size.height))
        onAddElement(activeTool, nx, ny)
      }
    },
    [activeTool, onAddElement, readonly, size, stageRef],
  )

  const setElementRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      elementRefs.current.set(id, node)
    } else {
      elementRefs.current.delete(id)
    }
  }, [])

  return (
    <div ref={containerRef} className="field-canvas-wrapper">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
        className="field-stage"
      >
        <Layer>
          <FieldMarkings field={field} width={size.width} height={size.height} />
          {showGrid && <FieldGrid width={size.width} height={size.height} />}
        </Layer>
        <Layer>
          {elements.map((el) => (
            <DraggableElement
              key={el.id}
              ref={(node) => setElementRef(el.id, node)}
              element={el}
              fieldWidth={size.width}
              fieldHeight={size.height}
              selected={selectedIds.includes(el.id)}
              readonly={readonly}
              onSelect={handleElementSelect}
              onDragStart={handleElementDragStart}
              onDragMove={handleElementDragMove}
              onDragEnd={handleElementDragEnd}
            />
          ))}
          {marquee && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.width}
              height={marquee.height}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dash={[6, 4]}
              listening={false}
            />
          )}
          {!readonly && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={[]}
              borderStroke="#fbbf24"
              borderDash={[4, 4]}
              onTransformEnd={handleTransformEnd}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
