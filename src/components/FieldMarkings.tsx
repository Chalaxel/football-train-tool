import { useMemo, type ReactElement } from 'react'
import { Line, Circle, Rect, Group, Arc } from 'react-konva'
import type { FieldConfig } from '../types'
import { pitchTransform, scaledMarkings } from '../utils/fieldDimensions'

interface FieldMarkingsProps {
  field: FieldConfig
  width: number
  height: number
}

const LINE_COLOR = 'rgba(255,255,255,0.9)'
const LINE_WIDTH = 2
const STRIPE_COUNT = 14

function rectOutlinePx(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  toPx: (x: number, y: number) => readonly [number, number],
): number[] {
  const [a, b] = toPx(x1, y1)
  const [c, d] = toPx(x2, y1)
  const [e, f] = toPx(x2, y2)
  const [g, h] = toPx(x1, y2)
  return [a, b, c, d, e, f, g, h, a, b]
}

function cornerArc(
  cornerX: number,
  cornerY: number,
  r: number,
  toPx: (x: number, y: number) => readonly [number, number],
  spanLength: (m: number) => number,
): ReactElement {
  const [cx, cy] = toPx(cornerX, cornerY)
  const radius = spanLength(r)
  let rotation = 0
  if (cornerX === 0 && cornerY === 0) rotation = 0
  else if (cornerY === 0) rotation = 90
  else if (cornerX > 0 && cornerY > 0) rotation = 180
  else rotation = 270

  return (
    <Arc
      key={`corner-${cornerX}-${cornerY}`}
      x={cx}
      y={cy}
      innerRadius={radius}
      outerRadius={radius}
      angle={90}
      rotation={rotation}
      stroke={LINE_COLOR}
      strokeWidth={LINE_WIDTH}
    />
  )
}

function penaltyArc(
  side: 'left' | 'right',
  spotX: number,
  spotY: number,
  penDepth: number,
  arcRadius: number,
  lengthM: number,
  toPx: (x: number, y: number) => readonly [number, number],
  spanLength: (m: number) => number,
): ReactElement {
  const [cx, cy] = toPx(spotX, spotY)
  const r = spanLength(arcRadius)
  const dx = side === 'left' ? penDepth - spotX : spotX - (lengthM - penDepth)
  const halfAngle = Math.acos(Math.min(1, Math.max(-1, dx / arcRadius)))
  const halfDeg = (halfAngle * 180) / Math.PI
  const rotation = side === 'left' ? -halfDeg : 180 - halfDeg

  return (
    <Arc
      key={`pen-arc-${side}`}
      x={cx}
      y={cy}
      innerRadius={r}
      outerRadius={r}
      angle={2 * halfDeg}
      rotation={rotation}
      stroke={LINE_COLOR}
      strokeWidth={LINE_WIDTH}
    />
  )
}

export function FieldMarkings({ field, width, height }: FieldMarkingsProps) {
  const isHalf = field.preset === 'half'
  const isCustom = field.preset === 'custom'
  const m = scaledMarkings(field)
  const tf = useMemo(() => pitchTransform(field, width, height), [field, width, height])
  const { lengthM, widthM, toPx, spanLength, spanWidth } = tf

  const lines = useMemo(() => {
    if (isCustom) return []

    const result: number[][] = []

    // Outer boundary — same frame as green background
    result.push([0, 0, width, 0, width, height, 0, height, 0, 0])

    // Halfway line (vertical, full pitch)
    if (!isHalf) {
      const [mx] = toPx(lengthM / 2, 0)
      result.push([mx, 0, mx, height])
    }

    const sides: Array<'left' | 'right'> = isHalf ? ['right'] : ['left', 'right']

    for (const side of sides) {
      const along1 = side === 'left' ? 0 : lengthM - m.penaltyDepth
      const along2 = side === 'left' ? m.penaltyDepth : lengthM
      const across1 = (widthM - m.penaltyWidth) / 2
      const across2 = (widthM + m.penaltyWidth) / 2
      result.push(rectOutlinePx(along1, across1, along2, across2, toPx))

      const gaAlong1 = side === 'left' ? 0 : lengthM - m.goalAreaDepth
      const gaAlong2 = side === 'left' ? m.goalAreaDepth : lengthM
      const gaAcross1 = (widthM - m.goalAreaWidth) / 2
      const gaAcross2 = (widthM + m.goalAreaWidth) / 2
      result.push(rectOutlinePx(gaAlong1, gaAcross1, gaAlong2, gaAcross2, toPx))
    }

    return result
  }, [isCustom, isHalf, lengthM, widthM, m, toPx, width, height])

  const centerMarkings = useMemo(() => {
    if (isCustom || isHalf) return null
    const [cx, cy] = toPx(lengthM / 2, widthM / 2)
    const radius = spanLength(m.centerCircleRadius)
    return (
      <>
        <Circle x={cx} y={cy} radius={radius} stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />
        <Circle x={cx} y={cy} radius={3} fill={LINE_COLOR} />
      </>
    )
  }, [isCustom, isHalf, lengthM, widthM, m.centerCircleRadius, toPx, spanLength])

  const penaltySpots = useMemo(() => {
    if (isCustom) return []
    const sides: Array<'left' | 'right'> = isHalf ? ['right'] : ['left', 'right']
    return sides.map((side) => {
      const x = side === 'left' ? m.penaltySpot : lengthM - m.penaltySpot
      const [px, py] = toPx(x, widthM / 2)
      return <Circle key={`spot-${side}`} x={px} y={py} radius={3} fill={LINE_COLOR} />
    })
  }, [isCustom, isHalf, lengthM, widthM, m.penaltySpot, toPx])

  const penaltyArcs = useMemo(() => {
    if (isCustom) return []
    const sides: Array<'left' | 'right'> = isHalf ? ['right'] : ['left', 'right']
    return sides.map((side) => {
      const x = side === 'left' ? m.penaltySpot : lengthM - m.penaltySpot
      return penaltyArc(side, x, widthM / 2, m.penaltyDepth, m.centerCircleRadius, lengthM, toPx, spanLength)
    })
  }, [isCustom, isHalf, lengthM, widthM, m, toPx, spanLength])

  const cornerArcs = useMemo(() => {
    if (isCustom) return []
    const corners: Array<[number, number]> = isHalf
      ? [
          [lengthM, 0],
          [lengthM, widthM],
        ]
      : [
          [0, 0],
          [lengthM, 0],
          [lengthM, widthM],
          [0, widthM],
        ]
    return corners.map(([x, y]) => cornerArc(x, y, m.cornerArcRadius, toPx, spanLength))
  }, [isCustom, isHalf, lengthM, widthM, m.cornerArcRadius, toPx, spanLength])

  const goals = useMemo(() => {
    if (isCustom) return []
    const sides: Array<'left' | 'right'> = isHalf ? ['right'] : ['left', 'right']
    return sides.map((side) => {
      const x = side === 'left' ? -m.goalDepth * 0.25 : lengthM - m.goalDepth * 0.75
      const y = (widthM - m.goalWidth) / 2
      const [px, py] = toPx(x, y)
      return (
        <Rect
          key={`goal-${side}`}
          x={px}
          y={py}
          width={spanLength(m.goalDepth)}
          height={spanWidth(m.goalWidth)}
          stroke={LINE_COLOR}
          strokeWidth={3}
          fill="rgba(255,255,255,0.12)"
        />
      )
    })
  }, [isCustom, isHalf, lengthM, widthM, m, toPx, spanLength, spanWidth])

  // Mowing stripes along pitch length (vertical bands = same x-axis as length)
  const stripes = useMemo(() => {
    const bandWidth = width / STRIPE_COUNT
    return Array.from({ length: STRIPE_COUNT }).map((_, i) => (
      <Rect
        key={`stripe-${i}`}
        x={bandWidth * i}
        y={0}
        width={bandWidth}
        height={height}
        fill={i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'}
        listening={false}
      />
    ))
  }, [width, height])

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="#2d8a4e" listening={false} />
      {stripes}
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          closed={points.length === 10}
          listening={false}
        />
      ))}
      {centerMarkings}
      {penaltySpots}
      {penaltyArcs}
      {cornerArcs}
      {goals}
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
