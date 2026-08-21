import { useMemo, type ReactElement } from 'react'
import { Line, Circle, Rect, Group } from 'react-konva'
import type { FieldConfig } from '../types'
import { MARKINGS } from '../utils/fieldDimensions'

interface FieldMarkingsProps {
  field: FieldConfig
  width: number
  height: number
}

function metersToPx(meters: number, fieldM: number, px: number): number {
  return (meters / fieldM) * px
}

export function FieldMarkings({ field, width, height }: FieldMarkingsProps) {
  const isHalf = field.preset === 'half'
  const lines = useMemo(() => {
    const result: Array<{ points: number[]; dash?: number[] }> = []
    const W = field.widthM
    const H = field.heightM

    const mx = (x: number) => (x / W) * width
    const my = (y: number) => (y / H) * height

    // Outer boundary
    result.push({ points: [0, 0, width, 0, width, height, 0, height, 0, 0] })

    if (!isHalf) {
      // Halfway line
      result.push({ points: [mx(W / 2), 0, mx(W / 2), height] })
    }

    // Goals at top and bottom (only bottom for half field emphasis, both for full)
    const goals = isHalf ? ['bottom'] : ['top', 'bottom']

    for (const side of goals) {
      const goalY = side === 'top' ? 0 : H
      const dir = side === 'top' ? 1 : -1

      const penDepth = MARKINGS.penaltyDepth
      const penWidth = MARKINGS.penaltyWidth
      const gaDepth = MARKINGS.goalAreaDepth
      const gaWidth = MARKINGS.goalAreaWidth

      const penX1 = (W - penWidth) / 2
      const gaX1 = (W - gaWidth) / 2

      // Penalty area
      result.push({
        points: [
          mx(penX1), my(goalY),
          mx(penX1), my(goalY + dir * penDepth),
          mx(penX1 + penWidth), my(goalY + dir * penDepth),
          mx(penX1 + penWidth), my(goalY),
        ],
      })

      // Goal area
      result.push({
        points: [
          mx(gaX1), my(goalY),
          mx(gaX1), my(goalY + dir * gaDepth),
          mx(gaX1 + gaWidth), my(goalY + dir * gaDepth),
          mx(gaX1 + gaWidth), my(goalY),
        ],
      })
    }

    return result
  }, [field, width, height, isHalf])

  const centerCircle = !isHalf ? (
    <Circle
      x={width / 2}
      y={height / 2}
      radius={metersToPx(MARKINGS.centerCircleRadius, field.widthM, width)}
      stroke="rgba(255,255,255,0.85)"
      strokeWidth={2}
    />
  ) : null

  const penaltySpots = useMemo(() => {
    const spots: Array<{ x: number; y: number }> = []
    const W = field.widthM
    const H = field.heightM

    if (isHalf) {
      spots.push({ x: W / 2, y: H - MARKINGS.penaltySpot })
    } else {
      spots.push({ x: W / 2, y: MARKINGS.penaltySpot })
      spots.push({ x: W / 2, y: H - MARKINGS.penaltySpot })
    }

    return spots.map((s, i) => (
      <Circle
        key={i}
        x={(s.x / W) * width}
        y={(s.y / H) * height}
        radius={3}
        fill="rgba(255,255,255,0.85)"
      />
    ))
  }, [field, width, height, isHalf])

  const goals = useMemo(() => {
    const W = field.widthM
    const H = field.heightM
    const gw = MARKINGS.goalWidth
    const goalDepth = 2
    const items: ReactElement[] = []

    const drawGoal = (side: 'top' | 'bottom') => {
      const y = side === 'top' ? 0 : H - goalDepth
      items.push(
        <Rect
          key={`goal-${side}`}
          x={((W - gw) / 2 / W) * width}
          y={(y / H) * height}
          width={(gw / W) * width}
          height={(goalDepth / H) * height}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={3}
          fill="rgba(255,255,255,0.15)"
        />,
      )
    }

    if (isHalf) {
      drawGoal('bottom')
    } else {
      drawGoal('top')
      drawGoal('bottom')
    }

    return items
  }, [field, width, height, isHalf])

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="#2d8a4e" />
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
          closed={line.points.length === 10}
          dash={line.dash}
        />
      ))}
      {centerCircle}
      {penaltySpots}
      {goals}
      {/* Stripes for grass effect */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Rect
          key={`stripe-${i}`}
          x={0}
          y={(height / 10) * i}
          width={width}
          height={height / 10}
          fill={i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'}
          listening={false}
        />
      ))}
    </Group>
  )
}

export function FieldGrid({ width, height }: { width: number; height: number }) {
  const lines = []
  const steps = 10
  for (let i = 1; i < steps; i++) {
    const x = (width / steps) * i
    const y = (height / steps) * i
    lines.push(
      <Line key={`v-${i}`} points={[x, 0, x, height]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />,
      <Line key={`h-${i}`} points={[0, y, width, y]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />,
    )
  }
  return <Group listening={false}>{lines}</Group>
}
