import type { ElementDefinition, ElementType, Team } from '../types'

interface ElementPaletteProps {
  activeTool: ElementType | 'select' | null
  team: Team
  readonly: boolean
  onToolChange: (tool: ElementType | 'select') => void
  onTeamChange: (team: Team) => void
}

export const ELEMENTS: ElementDefinition[] = [
  { type: 'player', label: 'Joueur', icon: '👤' },
  { type: 'goalkeeper', label: 'Gardien', icon: '🧤' },
  { type: 'ball', label: 'Ballon', icon: '⚽' },
  { type: 'cone', label: 'Plot', icon: '🔶' },
  { type: 'miniGoal', label: 'Mini-but', icon: '🥅' },
  { type: 'arrow', label: 'Flèche', icon: '➡️' },
]

export function ElementPalette({ activeTool, team, readonly, onToolChange, onTeamChange }: ElementPaletteProps) {
  return (
    <section className="panel element-palette">
      <h2>Éléments</h2>
      <div className="tool-grid">
        <button
          type="button"
          className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          disabled={readonly}
          onClick={() => onToolChange('select')}
          title="Sélectionner / déplacer"
        >
          <span>🖱️</span>
          <span>Sélection</span>
        </button>
        {ELEMENTS.map((el) => (
          <button
            key={el.type}
            type="button"
            className={`tool-btn ${activeTool === el.type ? 'active' : ''}`}
            disabled={readonly}
            onClick={() => onToolChange(el.type)}
            title={`Placer un ${el.label.toLowerCase()}`}
          >
            <span>{el.icon}</span>
            <span>{el.label}</span>
          </button>
        ))}
      </div>
      <div className="team-picker">
        <span>Équipe :</span>
        <button
          type="button"
          className={`team-btn home ${team === 'home' ? 'active' : ''}`}
          disabled={readonly}
          onClick={() => onTeamChange('home')}
        >
          Bleu
        </button>
        <button
          type="button"
          className={`team-btn away ${team === 'away' ? 'active' : ''}`}
          disabled={readonly}
          onClick={() => onTeamChange('away')}
        >
          Rouge
        </button>
      </div>
      <p className="hint">Cliquez sur le terrain pour placer l'élément sélectionné.</p>
    </section>
  )
}
