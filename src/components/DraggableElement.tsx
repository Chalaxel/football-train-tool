import { Circle, Group, RegularPolygon, Rect, Text, Arrow } from 'react-konva'
import type { FieldElement } from '../types'

interface DraggableElementProps {
  element: FieldElement
  fieldWidth: number
  fieldHeight: number
  selected: boolean
  readonly: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

function pxX(x: number, w: number) {
  return x * w
}

function pxY(y: number, h: number) {
  return y * h
}

export function DraggableElement({
  element,
  fieldWidth,
  fieldHeight,
  selected,
  readonly,
  onSelect,
  onDragEnd,
}: DraggableElementProps) {
  const x = pxX(element.x, fieldWidth)
  const y = pxY(element.y, fieldHeight)

  const handleDragEnd = (e: { target: { x: () => number; y: () => number } }) => {
    const nx = Math.min(1, Math.max(0, e.target.x() / fieldWidth))
    const ny = Math.min(1, Math.max(0, e.target.y() / fieldHeight))
    onDragEnd(element.id, nx, ny)
  }

  const selectionRing = selected ? (
    <Circle
      x={0}
      y={0}
      radius={22}
      stroke="#fbbf24"
      strokeWidth={2}
      dash={[4, 4]}
    />
  ) : null

  const commonProps = {
    draggable: !readonly,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onDragEnd: handleDragEnd,
    x,
    y,
  }

  switch (element.type) {
    case 'player': {
      const color = element.team === 'away' ? '#ef4444' : '#3b82f6'
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
      const color = element.team === 'away' ? '#b91c1c' : '#1d4ed8'
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
        <Group {...commonProps} offsetX={0} offsetY={0}>
          {selectionRing}
          <Rect
            x={-20}
            y={-12}
            width={40}
            height={24}
            stroke="#fff"
            strokeWidth={3}
            cornerRadius={2}
          />
        </Group>
      )
    case 'arrow':
      return (
        <Group
          {...commonProps}
          rotation={element.rotation}
        >
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
}
