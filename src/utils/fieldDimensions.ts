import type { FieldConfig, FieldPreset } from '../types'

/** widthM = length (goal↔goal), heightM = width (touchline↔touchline) */
export const FULL_FIELD = { widthM: 105, heightM: 68 }
export const HALF_FIELD = { widthM: 52.5, heightM: 68 }

export function presetToConfig(preset: FieldPreset, custom?: { widthM: number; heightM: number }): FieldConfig {
  switch (preset) {
    case 'full':
      return { preset: 'full', ...FULL_FIELD }
    case 'half':
      return { preset: 'half', ...HALF_FIELD }
    case 'custom':
      return {
        preset: 'custom',
        widthM: custom?.widthM ?? 40,
        heightM: custom?.heightM ?? 30,
      }
  }
}

/** Landscape canvas: horizontal = length, vertical = width */
export function fieldAspectRatio(field: FieldConfig): number {
  return field.widthM / field.heightM
}

/** FIFA dimensions in metres (reference pitch 105 × 68 m) */
export const MARKINGS = {
  penaltyDepth: 16.5,
  penaltyWidth: 40.32,
  goalAreaDepth: 5.5,
  goalAreaWidth: 18.32,
  centerCircleRadius: 9.15,
  penaltySpot: 11,
  cornerArcRadius: 1,
  goalWidth: 7.32,
}

export function scaledMarkings(field: FieldConfig) {
  const lengthScale = field.widthM / FULL_FIELD.widthM
  const widthScale = field.heightM / FULL_FIELD.heightM
  const uniformScale = Math.min(lengthScale, widthScale)
  return {
    penaltyDepth: MARKINGS.penaltyDepth * lengthScale,
    penaltyWidth: MARKINGS.penaltyWidth * widthScale,
    goalAreaDepth: MARKINGS.goalAreaDepth * lengthScale,
    goalAreaWidth: MARKINGS.goalAreaWidth * widthScale,
    centerCircleRadius: MARKINGS.centerCircleRadius * uniformScale,
    penaltySpot: MARKINGS.penaltySpot * lengthScale,
    cornerArcRadius: MARKINGS.cornerArcRadius * uniformScale,
    goalWidth: MARKINGS.goalWidth * widthScale,
    goalDepth: 2 * lengthScale,
  }
}

/**
 * Single coordinate system for the whole pitch layer.
 * Canvas x → length (m), canvas y → width (m).
 * Goals on left (x=0) and right (x=lengthM).
 */
export function pitchTransform(field: FieldConfig, pxW: number, pxH: number) {
  const lengthM = field.widthM
  const widthM = field.heightM
  const pxPerLength = pxW / lengthM
  const pxPerWidth = pxH / widthM

  return {
    lengthM,
    widthM,
    pxPerLength,
    pxPerWidth,
    /** @param xM along pitch length (goal line to goal line) */
    /** @param yM across pitch width (touchline to touchline) */
    toPx(xM: number, yM: number): readonly [number, number] {
      return [xM * pxPerLength, yM * pxPerWidth]
    },
    spanLength(m: number): number {
      return m * pxPerLength
    },
    spanWidth(m: number): number {
      return m * pxPerWidth
    },
  }
}
