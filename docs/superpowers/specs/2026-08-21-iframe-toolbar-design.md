# Design : Layout iframe + barre d'outils compacte

**Date :** 2026-08-21  
**Statut :** Approuvé (sections 1–4)

## Contexte

L'application actuelle utilise un layout sidebar (300px) + terrain. En mode iframe (`?embed=1`), seul le header disparaît — le terrain est compressé et l'UI ressemble à une app complète plutôt qu'à un widget intégrable.

**Objectifs :**
- UI = terrain plein écran + barre d'outils en haut (standalone et embed identiques)
- Tous les réglages restent dans l'iframe (autonomie complète)
- Libs UI légères : Radix + lucide-react
- Rotation des flèches (besoin identifié précédemment)
- Conserver Konva/react-konva pour le canvas tactique

## Décisions validées

| Question | Choix |
|----------|-------|
| Config terrain en iframe | B — tout dans l'iframe |
| Position barre d'outils | A — en haut |
| Standalone vs embed | A — UI identique partout |
| Libs tierces | B — Radix headless + lucide-react |
| Organisation toolbar | C — menus déroulants groupés |

---

## Section 1 — Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Sélection] [Joueurs ▾] [Matériel ▾] [Terrain ▾]     │
│                          [Grille] [Export] [Supprimer]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    TERRAIN (100%)                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Viewport : `100vh × 100vw`, sans scroll vertical
- Toolbar : hauteur fixe ~48px
- Canvas : `flex: 1`, remplit l'espace restant
- Suppression : sidebar, header, padding latéral du layout actuel
- `?embed=1` : même UI ; seul le contexte parent (postMessage) diffère

---

## Section 2 — Barre d'outils

### Structure

| Zone | Contenu |
|------|---------|
| Gauche | Sélection · Joueurs ▾ · Matériel ▾ · Terrain ▾ |
| Droite | Grille · Export PNG · Supprimer · Tout effacer |

### Menu « Joueurs »
- Placer Joueur
- Placer Gardien
- Toggle équipe Bleu / Rouge (Radix ToggleGroup)

### Menu « Matériel »
- Ballon · Plot · Mini-but · Flèche

### Menu « Terrain »
- Presets : Complet (105×68 m) · Demi (52,5×68 m) · Personnalisé
- Champs largeur/longueur si Personnalisé
- Affichage dimensions actuelles

### Actions contextuelles (flèche sélectionnée)
- Boutons −45° / +45° visibles à droite de la barre
- Poignée de rotation Konva Transformer sur le canvas

### Libs ajoutées

| Package | Usage |
|---------|-------|
| `@radix-ui/react-dropdown-menu` | Menus Joueurs, Matériel, Terrain |
| `@radix-ui/react-toggle-group` | Équipe bleu/rouge |
| `@radix-ui/react-tooltip` | Infobulles icônes |
| `lucide-react` | Icônes (remplace emojis) |

**Conservé :** `konva`, `react-konva`, `uuid`

### Mode readonly
- `?readonly=1` : boutons d'édition désactivés, export autorisé
- API postMessage inchangée : `ftt:getState`, `ftt:setState`, `ftt:export`

---

## Section 3 — Architecture & composants

### Arborescence cible

```
src/
├── App.tsx                    # État global, handlers
├── App.css                    # Layout flex column, toolbar, canvas
├── components/
│   ├── TopToolbar.tsx         # NOUVEAU — barre horizontale Radix
│   ├── FieldCanvas.tsx        # Canvas plein écran + Transformer
│   ├── DraggableElement.tsx   # Éléments Konva (inchangé sauf ref node)
│   ├── FieldMarkings.tsx      # Inchangé
│   └── (supprimés)
│       ├── ElementPalette.tsx
│       ├── FieldSettings.tsx
│       └── Toolbar.tsx        # Remplacé par TopToolbar
```

### TopToolbar — props

```typescript
interface TopToolbarProps {
  readonly: boolean
  activeTool: ElementType | 'select'
  team: Team
  fieldPreset: FieldPreset
  customWidth: number
  customHeight: number
  showGrid: boolean
  selectedElement: FieldElement | null
  onToolChange: (tool: ElementType | 'select') => void
  onTeamChange: (team: Team) => void
  onPresetChange: (preset: FieldPreset) => void
  onCustomChange: (w: number, h: number) => void
  onToggleGrid: () => void
  onExport: () => void
  onDelete: () => void
  onClear: () => void
  onRotate: (delta: number) => void  // flèches uniquement
}
```

### FieldCanvas — changements

- Supprimer `MAX_WIDTH` / `MAX_HEIGHT` comme contraintes principales
- Calculer `size` depuis `containerRef.clientWidth` et `clientHeight` (pas seulement width)
- Ajouter `Konva.Transformer` lié au node de l'élément sélectionné
- Nouveaux callbacks : `onRotateElement(id, rotation)`

### App.tsx — nouveaux handlers

```typescript
handleRotateElement(id: string, delta: number)
handleRotateElementAbsolute(id: string, rotation: number)  // depuis Transformer
```

Raccourcis clavier (flèche sélectionnée) :
- `R` → +15°
- `Shift+R` → −15°

### Data flow

```
TopToolbar ──onToolChange──► App (activeTool)
TopToolbar ──onPresetChange──► App (fieldPreset, clear elements)
FieldCanvas ──onAddElement──► App (elements[])
FieldCanvas ──onMoveElement──► App (elements[])
FieldCanvas ──onRotateElement──► App (elements[].rotation)
Transformer onTransformEnd ──► App (rotation absolue)
postMessage ftt:setState ──► App (loadState) — inchangé
```

---

## Section 4 — Canvas, rotation flèches & migration

### Rotation flèches

1. **Toolbar** : boutons ±45° quand `selectedElement?.type === 'arrow'`
2. **Clavier** : R / Shift+R par pas de 15°
3. **Transformer Konva** : `rotateEnabled={true}`, `enabledAnchors={[]}` (rotation seule, pas de resize)
   - `onTransformEnd` → lire `node.rotation()`, normaliser 0–360, persister dans state
   - Appliqué uniquement aux flèches

### Redimensionnement canvas

```typescript
// FieldCanvas — pseudo-code
const update = () => {
  const { clientWidth, clientHeight } = containerRef.current
  const ratio = fieldAspectRatio(field)
  // Fit terrain dans le conteneur en conservant le ratio
  let width = clientWidth
  let height = width / ratio
  if (height > clientHeight) {
    height = clientHeight
    width = height * ratio
  }
  setSize({ width, height })
}
```

Le wrapper canvas est centré verticalement et horizontalement dans l'espace restant.

### CSS layout

```css
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top-toolbar { flex-shrink: 0; height: 48px; }
.canvas-area { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
```

### Migration

| Fichier | Action |
|---------|--------|
| `ElementPalette.tsx` | Supprimer — logique → TopToolbar |
| `FieldSettings.tsx` | Supprimer — logique → menu Terrain |
| `Toolbar.tsx` | Supprimer — remplacé par TopToolbar |
| `App.tsx` | Refactor layout, handlers rotation |
| `App.css` | Nouveau layout flex column |
| `FieldCanvas.tsx` | Full-height sizing + Transformer |
| `DraggableElement.tsx` | Exposer ref Konva Group via forwardRef |
| `README.md` | Mettre à jour captures/description UI |

### Tests manuels

1. Standalone : toolbar visible, terrain occupe l'espace restant
2. iframe 960×720 : pas de scroll, terrain centré
3. Menus déroulants : placement joueurs, changement preset, custom dimensions
4. Flèche : rotation ±45°, R clavier, poignée Transformer
5. `?readonly=1` : édition bloquée, export OK
6. postMessage getState/setState/export : comportement identique
7. Export PNG : résolution haute résolution conservée

### Hors scope

- Sidebar repliable
- Lib whiteboard (Excalidraw, tldraw)
- Rotation d'autres éléments que les flèches
- Redimensionnement longueur flèche (future itération)
- Tests automatisés (pas de setup test existant)

---

## Contraintes globales

- Bundle iframe léger : pas de MUI/shadcn complet
- API postMessage rétrocompatible
- Français pour tous les labels UI
- Conventional commits (feat, fix, chore, docs, refactor)
