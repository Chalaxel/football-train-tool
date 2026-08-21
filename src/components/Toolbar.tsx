interface ToolbarProps {
  readonly: boolean
  showGrid: boolean
  selectedCount: number
  onDelete: () => void
  onClear: () => void
  onExport: () => void
  onToggleGrid: () => void
  onCopyEmbedCode: () => void
}

export function Toolbar({
  readonly,
  showGrid,
  selectedCount,
  onDelete,
  onClear,
  onExport,
  onToggleGrid,
  onCopyEmbedCode,
}: ToolbarProps) {
  return (
    <section className="panel toolbar">
      <h2>Actions</h2>
      <div className="action-row">
        <button type="button" className="action-btn danger" disabled={readonly || selectedCount === 0} onClick={onDelete}>
          Supprimer
        </button>
        <button type="button" className="action-btn danger-outline" disabled={readonly} onClick={onClear}>
          Tout effacer
        </button>
      </div>
      <div className="action-row">
        <button type="button" className="action-btn" onClick={onToggleGrid}>
          {showGrid ? 'Masquer grille' : 'Afficher grille'}
        </button>
      </div>
      <div className="action-row">
        <button type="button" className="action-btn primary" onClick={onExport}>
          Exporter PNG
        </button>
        <button type="button" className="action-btn secondary" onClick={onCopyEmbedCode}>
          Copier iframe
        </button>
      </div>
    </section>
  )
}
