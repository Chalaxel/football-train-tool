import type { Team } from '../types'

export const TEAM_META: Record<Team, { label: string; player: string; goalkeeper: string }> = {
  home: { label: 'Bleu', player: '#3b82f6', goalkeeper: '#1d4ed8' },
  away: { label: 'Rouge', player: '#ef4444', goalkeeper: '#b91c1c' },
  yellow: { label: 'Jaune', player: '#eab308', goalkeeper: '#ca8a04' },
  black: { label: 'Noir', player: '#1f2937', goalkeeper: '#111827' },
}

export function teamPlayerColor(team: Team): string {
  return TEAM_META[team].player
}

export function teamGoalkeeperColor(team: Team): string {
  return TEAM_META[team].goalkeeper
}
