import type { AppState } from '../types'

export const IFRAME_MESSAGE_SOURCE = 'football-train-tool'

export type IframeRequest =
  | { type: 'ftt:getState' }
  | { type: 'ftt:setState'; payload: AppState }
  | { type: 'ftt:export' }

export type IframeResponse =
  | { source: typeof IFRAME_MESSAGE_SOURCE; type: 'ftt:state'; payload: AppState }
  | { source: typeof IFRAME_MESSAGE_SOURCE; type: 'ftt:export'; payload: string }
  | { source: typeof IFRAME_MESSAGE_SOURCE; type: 'ftt:ready' }

export function parseEmbedParams(search: string): { embed: boolean; readonly: boolean } {
  const params = new URLSearchParams(search)
  return {
    embed: params.get('embed') === '1' || params.get('embed') === 'true',
    readonly: params.get('readonly') === '1' || params.get('readonly') === 'true',
  }
}

export function postToParent(message: IframeResponse): void {
  if (window.parent !== window) {
    window.parent.postMessage(message, '*')
  }
}
