import type { FieldPreset } from '../types'
import { presetToConfig } from '../utils/fieldDimensions'

interface FieldSettingsProps {
  preset: FieldPreset
  customWidth: number
  customHeight: number
  readonly: boolean
  onPresetChange: (preset: FieldPreset) => void
  onCustomChange: (width: number, height: number) => void
}

const PRESETS: Array<{ value: FieldPreset; label: string; detail: string }> = [
  { value: 'full', label: 'Complet', detail: '105 × 68 m' },
  { value: 'half', label: 'Demi', detail: '52,5 × 68 m' },
  { value: 'custom', label: 'Personnalisé', detail: 'Dimensions libres' },
]

export function FieldSettings({
  preset,
  customWidth,
  customHeight,
  readonly,
  onPresetChange,
  onCustomChange,
}: FieldSettingsProps) {
  return (
    <section className="panel field-settings">
      <h2>Terrain</h2>
      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`preset-btn ${preset === p.value ? 'active' : ''}`}
            disabled={readonly}
            onClick={() => onPresetChange(p.value)}
          >
            <span className="preset-label">{p.label}</span>
            <span className="preset-detail">{p.detail}</span>
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="custom-dimensions">
          <label>
            Largeur (m)
            <input
              type="number"
              min={10}
              max={120}
              value={customWidth}
              disabled={readonly}
              onChange={(e) => onCustomChange(Number(e.target.value), customHeight)}
            />
          </label>
          <label>
            Longueur (m)
            <input
              type="number"
              min={10}
              max={120}
              value={customHeight}
              disabled={readonly}
              onChange={(e) => onCustomChange(customWidth, Number(e.target.value))}
            />
          </label>
        </div>
      )}
      <p className="field-info">
        {presetToConfig(preset, { widthM: customWidth, heightM: customHeight }).widthM} ×{' '}
        {presetToConfig(preset, { widthM: customWidth, heightM: customHeight }).heightM} m
      </p>
    </section>
  )
}
