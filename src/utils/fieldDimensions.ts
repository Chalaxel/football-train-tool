import type { FieldConfig, FieldPreset } from '../types'

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

export function fieldAspectRatio(field: FieldConfig): number {
  return field.widthM / field.heightM
}

/** FIFA proportions relative to field width (W) and length (L = height in top-down view) */
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
