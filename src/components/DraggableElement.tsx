import { forwardRef } from 'react'
import { Circle, Group, RegularPolygon, Rect, Text, Arrow } from 'react-konva'
import type Konva from 'konva'
import type { FieldElement } from '../types'
import { teamGoalkeeperColor, teamPlayerColor } from '../utils/teamColors'

interface DraggableElementProps {
  element: FieldElement
  fieldWidth: number
  fieldHeight: number
  selected: boolean
  readonly: boolean
  onSelect: (id: string) => void
  onDragStart?: (id: string) => void
  onDragMove?: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

function pxX(x: number, w: number) {
  return x * w
}

function pxY(y: number, h: number) {
  return y * h
}

export const DraggableElement = forwardRef<Konva.Group, DraggableElementProps>(function DraggableElement(
  { element, fieldWidth, fieldHeight, selected, readonly, onSelect, onDragStart, onDragMove, onDragEnd },
  ref,
) {
  const x = pxX(element.x, fieldWidth)
  const y = pxY(element.y, fieldHeight)

  const handleDragEnd = (e: { target: { x: () => number; y: () => number } }) => {
    const nx = Math.min(1, Math.max(0, e.target.x() / fieldWidth))
    const ny = Math.min(1, Math.max(0, e.target.y() / fieldHeight))
    onDragEnd(element.id, nx, ny)
  }

  const selectionRing = selected ? (
    <Circle x={0} y={0} radius={22} stroke="#fbbf24" strokeWidth={2} dash={[4, 4]} />
  ) : null

  const commonProps = {
    ref,
    draggable: !readonly,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onDragStart: onDragStart ? () => onDragStart(element.id) : undefined,
    onDragMove: onDragMove ? (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(element.id, e) : undefined,
    onDragEnd: handleDragEnd,
    x,
    y,
    rotation: element.type === 'arrow' ? element.rotation : 0,
  }

  switch (element.type) {
    case 'player': {
      const color = teamPlayerColor(element.team ?? 'home')
      return (
        <Group {...commonProps}>
          {selectionRing}
          <Circle radius={16} fill={color} stroke="#fff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.3} />
          <Text
            text={String(element.number ?? '')}
            fontSize={14}
            fontStyle="bold"
            fill="#fff"
            align="center"
            verticalAlign="middle"
            offsetX={7}
            offsetY={7}
            width={14}
          />
        </Group>
      )
    }
    case 'goalkeeper': {
      const color = teamGoalkeeperColor(element.team ?? 'home')
      return (
        <Group {...commonProps}>
          {selectionRing}
          <Rect x={-14} y={-14} width={28} height={28} fill={color} stroke="#fff" strokeWidth={2} cornerRadius={4} />
          <Text text="G" fontSize={14} fontStyle="bold" fill="#fff" offsetX={5} offsetY={7} />
        </Group>
      )
    }
    case 'ball':
      return (
        <Group {...commonProps}>
          {selectionRing}
          <Circle radius={8} fill="#f5f5f5" stroke="#333" strokeWidth={1.5} />
          <RegularPolygon sides={5} radius={4} fill="#333" rotation={20} />
        </Group>
      )
    case 'cone':
      return (
        <Group {...commonProps}>
          {selectionRing}
          <RegularPolygon
            sides={3}
            radius={14}
            fill="#f97316"
            stroke="#c2410c"
            strokeWidth={1.5}
            rotation={180}
          />
        </Group>
      )
    case 'miniGoal':
      return (
        <Group {...commonProps}>
          {selectionRing}
          <Rect x={-20} y={-12} width={40} height={24} stroke="#fff" strokeWidth={3} cornerRadius={2} />
        </Group>
      )
    case 'arrow':
      return (
        <Group {...commonProps}>
          {selectionRing}
          <Arrow
            points={[0, 0, 50, 0]}
            pointerLength={12}
            pointerWidth={12}
            fill="#fde047"
            stroke="#eab308"
            strokeWidth={3}
          />
        </Group>
      )
    default:
      return null
  }
})
