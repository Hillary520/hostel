export function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && 'results' in payload) {
    return (payload as { results: T[] }).results
  }
  return []
}
