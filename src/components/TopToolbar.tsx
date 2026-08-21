import type { ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  ArrowRight,
  ChevronDown,
  Circle,
  Cone,
  Download,
  Eraser,
  Goal,
  Grid3x3,
  MousePointer2,
  RotateCcw,
  RotateCw,
  Shield,
  Trash2,
  Users,
  Wrench,
  Map,
} from 'lucide-react'
import type { ElementType, FieldElement, FieldPreset, Team } from '../types'
import { presetToConfig } from '../utils/fieldDimensions'
import { TEAM_META } from '../utils/teamColors'

interface TopToolbarProps {
  readonly: boolean
  activeTool: ElementType | 'select'
  team: Team
  fieldPreset: FieldPreset
  customWidth: number
  customHeight: number
  showGrid: boolean
  selectedElement: FieldElement | null
  selectedCount: number
  onToolChange: (tool: ElementType | 'select') => void
  onTeamChange: (team: Team) => void
  onPresetChange: (preset: FieldPreset) => void
  onCustomChange: (w: number, h: number) => void
  onToggleGrid: () => void
  onExport: () => void
  onDelete: () => void
  onClear: () => void
  onRotate: (delta: number) => void
}

const PRESETS: Array<{ value: FieldPreset; label: string; detail: string }> = [
  { value: 'full', label: 'Complet', detail: '105 × 68 m' },
  { value: 'half', label: 'Demi', detail: '52,5 × 68 m' },
  { value: 'custom', label: 'Personnalisé', detail: 'Dimensions libres' },
]

const PLAYER_TOOLS: ElementType[] = ['player', 'goalkeeper']
const EQUIPMENT_TOOLS: ElementType[] = ['ball', 'cone', 'miniGoal', 'arrow']
const TEAMS: Team[] = ['home', 'away', 'yellow', 'black']

const TOOL_LABELS: Record<ElementType, string> = {
  player: 'Joueur',
  goalkeeper: 'Gardien',
  ball: 'Ballon',
  cone: 'Plot',
  miniGoal: 'Mini-but',
  arrow: 'Flèche',
}

function playerToolIcon(type: 'player' | 'goalkeeper', team: Team, size = 16): ReactNode {
  const color = type === 'player' ? TEAM_META[team].player : TEAM_META[team].goalkeeper
  if (type === 'player') {
    return <Circle size={size} fill={color} stroke="#fff" strokeWidth={1.5} />
  }
  return <Shield size={size} color={color} fill={color} stroke="#fff" strokeWidth={1.5} />
}

function equipmentToolIcon(type: Exclude<ElementType, 'player' | 'goalkeeper'>, size = 16): ReactNode {
  switch (type) {
    case 'ball':
      return <Circle size={size} />
    case 'cone':
      return <Cone size={size} className="toolbar-icon-orange" />
    case 'miniGoal':
      return <Goal size={size} />
    case 'arrow':
      return <ArrowRight size={size} className="toolbar-icon-yellow" />
  }
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  title: string
  children: ReactNode
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={`toolbar-btn ${active ? 'active' : ''}`}
          disabled={disabled}
          onClick={onClick}
          aria-label={title}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="toolbar-tooltip" sideOffset={6}>
          {title}
          <Tooltip.Arrow className="toolbar-tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function MenuTrigger({
  label,
  icon,
  disabled,
  active,
}: {
  label: string
  icon: ReactNode
  disabled?: boolean
  active?: boolean
}) {
  return (
    <DropdownMenu.Trigger asChild disabled={disabled}>
      <button
        type="button"
        className={`toolbar-menu-trigger ${active ? 'active' : ''}`}
        disabled={disabled}
        aria-label={label}
      >
        {icon}
        <span className="toolbar-menu-label">{label}</span>
        <ChevronDown size={14} className="toolbar-chevron" />
      </button>
    </DropdownMenu.Trigger>
  )
}

function menuState(
  activeTool: ElementType | 'select',
  tools: ElementType[],
  defaultLabel: string,
  defaultIcon: ReactNode,
  team?: Team,
) {
  if (tools.includes(activeTool as ElementType)) {
    const type = activeTool as ElementType
    const icon =
      team && PLAYER_TOOLS.includes(type)
        ? playerToolIcon(type as 'player' | 'goalkeeper', team)
        : equipmentToolIcon(type as Exclude<ElementType, 'player' | 'goalkeeper'>)
    return { label: TOOL_LABELS[type], icon, active: true }
  }
  return { label: defaultLabel, icon: defaultIcon, active: false }
}

export function TopToolbar({
  readonly,
  activeTool,
  team,
  fieldPreset,
  customWidth,
  customHeight,
  showGrid,
  selectedElement,
  selectedCount,
  onToolChange,
  onTeamChange,
  onPresetChange,
  onCustomChange,
  onToggleGrid,
  onExport,
  onDelete,
  onClear,
  onRotate,
}: TopToolbarProps) {
  const field = presetToConfig(fieldPreset, { widthM: customWidth, heightM: customHeight })
  const showArrowControls = selectedElement?.type === 'arrow' && !readonly
  const playerMenu = menuState(activeTool, PLAYER_TOOLS, 'Joueurs', <Users size={16} />, team)
  const equipmentMenu = menuState(activeTool, EQUIPMENT_TOOLS, 'Matériel', <Wrench size={16} />)

  const selectTool = (tool: ElementType | 'select') => {
    if (!readonly) onToolChange(tool)
  }

  return (
    <Tooltip.Provider delayDuration={400}>
      <header className="top-toolbar">
        <div className="toolbar-left">
          <ToolbarButton
            active={activeTool === 'select'}
            disabled={readonly}
            onClick={() => selectTool('select')}
            title="Sélectionner / déplacer"
          >
            <MousePointer2 size={18} />
          </ToolbarButton>

          <DropdownMenu.Root>
            <MenuTrigger
              label={playerMenu.label}
              icon={playerMenu.icon}
              active={playerMenu.active}
              disabled={readonly}
            />
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="toolbar-dropdown" align="start" sideOffset={6}>
                <DropdownMenu.Item
                  className={`toolbar-dropdown-item ${activeTool === 'player' ? 'active' : ''}`}
                  disabled={readonly}
                  onSelect={() => selectTool('player')}
                >
                  {playerToolIcon('player', team)}
                  Placer joueur
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={`toolbar-dropdown-item ${activeTool === 'goalkeeper' ? 'active' : ''}`}
                  disabled={readonly}
                  onSelect={() => selectTool('goalkeeper')}
                >
                  {playerToolIcon('goalkeeper', team)}
                  Placer gardien
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="toolbar-dropdown-separator" />
                <div className="toolbar-dropdown-section">
                  <span className="toolbar-dropdown-label">Équipe</span>
                  <ToggleGroup.Root
                    type="single"
                    value={team}
                    disabled={readonly}
                    onValueChange={(v) => {
                      if (v === 'home' || v === 'away' || v === 'yellow' || v === 'black') {
                        onTeamChange(v)
                      }
                    }}
                    className="team-toggle-group"
                  >
                    {TEAMS.map((t) => (
                      <ToggleGroup.Item key={t} value={t} className={`team-toggle team-${t}`}>
                        {TEAM_META[t].label}
                      </ToggleGroup.Item>
                    ))}
                  </ToggleGroup.Root>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <MenuTrigger
              label={equipmentMenu.label}
              icon={equipmentMenu.icon}
              active={equipmentMenu.active}
              disabled={readonly}
            />
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="toolbar-dropdown" align="start" sideOffset={6}>
                <DropdownMenu.Item
                  className={`toolbar-dropdown-item ${activeTool === 'ball' ? 'active' : ''}`}
                  disabled={readonly}
                  onSelect={() => selectTool('ball')}
                >
                  {equipmentToolIcon('ball')}
                  Ballon
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={`toolbar-dropdown-item ${activeTool === 'cone' ? 'active' : ''}`}
                  disabled={readonly}
                  onSelect={() => selectTool('cone')}
                >
                  {equipmentToolIcon('cone')}
                  Plot
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={`toolbar-dropdown-item ${activeTool === 'miniGoal' ? 'active' : ''}`}
                  disabled={readonly}
                  onSelect={() => selectTool('miniGoal')}
                >
                  {equipmentToolIcon('miniGoal')}
                  Mini-but
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={`toolbar-dropdown-item ${activeTool === 'arrow' ? 'active' : ''}`}
                  disabled={readonly}
                  onSelect={() => selectTool('arrow')}
                >
                  {equipmentToolIcon('arrow')}
                  Flèche
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <MenuTrigger label="Terrain" icon={<Map size={16} />} disabled={readonly} />
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="toolbar-dropdown toolbar-dropdown-wide" align="start" sideOffset={6}>
                {PRESETS.map((p) => (
                  <DropdownMenu.Item
                    key={p.value}
                    className={`toolbar-dropdown-item ${fieldPreset === p.value ? 'active' : ''}`}
                    disabled={readonly}
                    onSelect={() => onPresetChange(p.value)}
                  >
                    <div className="preset-item">
                      <span className="preset-label">{p.label}</span>
                      <span className="preset-detail">{p.detail}</span>
                    </div>
                  </DropdownMenu.Item>
                ))}
                {fieldPreset === 'custom' && (
                  <>
                    <DropdownMenu.Separator className="toolbar-dropdown-separator" />
                    <div className="toolbar-custom-dims">
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
                  </>
                )}
                <DropdownMenu.Separator className="toolbar-dropdown-separator" />
                <div className="toolbar-field-info">
                  {field.widthM} × {field.heightM} m
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="toolbar-right">
          {showArrowControls && (
            <div className="toolbar-arrow-controls">
              <ToolbarButton title="Tourner −45°" onClick={() => onRotate(-45)}>
                <RotateCcw size={18} />
              </ToolbarButton>
              <ToolbarButton title="Tourner +45°" onClick={() => onRotate(45)}>
                <RotateCw size={18} />
              </ToolbarButton>
            </div>
          )}

          <ToolbarButton
            active={showGrid}
            onClick={onToggleGrid}
            title={showGrid ? 'Masquer grille' : 'Afficher grille'}
          >
            <Grid3x3 size={18} />
          </ToolbarButton>

          <ToolbarButton onClick={onExport} title="Exporter PNG">
            <Download size={18} />
          </ToolbarButton>

          <ToolbarButton
            disabled={readonly || selectedCount === 0}
            onClick={onDelete}
            title={selectedCount > 1 ? `Supprimer ${selectedCount} éléments` : 'Supprimer la sélection'}
          >
            <Trash2 size={18} />
          </ToolbarButton>

          <ToolbarButton disabled={readonly} onClick={onClear} title="Tout effacer">
            <Eraser size={18} />
          </ToolbarButton>
        </div>
      </header>
    </Tooltip.Provider>
  )
}
