export type FieldPreset = 'full' | 'half' | 'custom'

export type ElementType =
  | 'player'
  | 'goalkeeper'
  | 'ball'
  | 'cone'
  | 'miniGoal'
  | 'arrow'

export type Team = 'home' | 'away' | 'yellow' | 'black'

export interface FieldConfig {
  preset: FieldPreset
  widthM: number
  heightM: number
}

export interface FieldElement {
  id: string
  type: ElementType
  /** Normalized X (0–1) along pitch length (canvas width) */
  x: number
  /** Normalized Y (0–1) across pitch width (canvas height) */
  y: number
  rotation: number
  team?: Team
  number?: number
  label?: string
}

export interface AppState {
  field: FieldConfig
  elements: FieldElement[]
}

export interface ElementDefinition {
  type: ElementType
  label: string
  icon: string
}
