# Football Train Tool

Créateur de visuel de séance de football — application React déployée sur GitHub Pages.

## Fonctionnalités

- **Interface compacte** : terrain plein écran + barre d'outils horizontale (idéal iframe)
- **Terrain 2D vue du dessus** avec marquages (surface, surface de réparation, cercle central…)
- **Dimensions** : terrain complet (105×68 m), demi-terrain (52,5×68 m) ou personnalisé
- **Éléments** : joueurs, gardiens, ballons, plots, mini-buts, flèches
- **Glisser-déposer** pour repositionner les éléments
- **Rotation des flèches** : poignée visuelle, boutons ±45°, raccourci R
- **Export PNG** haute résolution
- **Intégration iframe** pour applications tierces

## Démo

https://chalaxel.github.io/football-train-tool/

## Développement local

```bash
npm install
npm run dev
```

## Intégration iframe

```html
<iframe
  src="https://chalaxel.github.io/football-train-tool/?embed=1"
  width="960"
  height="720"
  frameborder="0"
  allow="clipboard-write"
  title="Créateur de séance foot"
></iframe>
```

### API postMessage

L'application répond aux messages suivants (source : `football-train-tool`) :

| Message | Description |
|---------|-------------|
| `{ type: 'ftt:getState' }` | Retourne l'état complet (terrain + éléments) |
| `{ type: 'ftt:setState', payload: AppState }` | Charge un état |
| `{ type: 'ftt:export' }` | Retourne un PNG en data URL |

Paramètres URL :
- `?embed=1` — alias historique (UI identique au mode standalone)
- `?readonly=1` — lecture seule

## Déploiement

Le déploiement GitHub Pages est automatique via GitHub Actions à chaque push sur `main`.

Assurez-vous que **Settings → Pages → Build and deployment → Source** est réglé sur **GitHub Actions**.
