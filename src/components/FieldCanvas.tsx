import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import type { ElementType, FieldConfig, FieldElement } from '../types'
import { FieldMarkings, FieldGrid } from './FieldMarkings'
import { DraggableElement } from './DraggableElement'
import { fieldAspectRatio } from '../utils/fieldDimensions'

interface FieldCanvasProps {
  field: FieldConfig
  elements: FieldElement[]
  selectedId: string | null
  activeTool: ElementType | 'select' | null
  readonly: boolean
  showGrid: boolean
  onSelect: (id: string | null) => void
  onAddElement: (type: ElementType, x: number, y: number) => void
  onMoveElement: (id: string, x: number, y: number) => void
  stageRef?: React.RefObject<Konva.Stage | null>
}

const MAX_WIDTH = 900
const MAX_HEIGHT = 620

export function FieldCanvas({
  field,
  elements,
  selectedId,
  activeTool,
  readonly,
  showGrid,
  onSelect,
  onAddElement,
  onMoveElement,
  stageRef: externalRef,
}: FieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const internalRef = useRef<Konva.Stage>(null)
  const stageRef = externalRef ?? internalRef
  const [size, setSize] = useState({ width: 800, height: 520 })

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth
      const ratio = fieldAspectRatio(field)
      let width = Math.min(containerWidth - 4, MAX_WIDTH)
      let height = width / ratio
      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT
        width = height * ratio
      }
      setSize({ width, height })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [field])

  const handleStageClick = useCallback(
    (e: { target: Konva.Node; evt: MouseEvent | TouchEvent }) => {
      if (readonly) return
      const stage = stageRef.current
      if (!stage) return

      if (e.target === stage || e.target.getClassName() === 'Rect' || e.target.getClassName() === 'Line') {
        if (activeTool && activeTool !== 'select') {
          const pos = stage.getPointerPosition()
          if (!pos) return
          const nx = Math.min(1, Math.max(0, pos.x / size.width))
          const ny = Math.min(1, Math.max(0, pos.y / size.height))
          onAddElement(activeTool, nx, ny)
        } else {
          onSelect(null)
        }
      }
    },
    [activeTool, onAddElement, onSelect, readonly, size, stageRef],
  )

  return (
    <div ref={containerRef} className="field-canvas-wrapper">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
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
              element={el}
              fieldWidth={size.width}
              fieldHeight={size.height}
              selected={selectedId === el.id}
              readonly={readonly}
              onSelect={onSelect}
              onDragEnd={onMoveElement}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export { MAX_WIDTH, MAX_HEIGHT }
