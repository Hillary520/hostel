export function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object') {
    const maybeResults = (payload as { results?: unknown }).results
    if (Array.isArray(maybeResults)) return maybeResults as T[]
    const maybeData = (payload as { data?: unknown }).data
    if (Array.isArray(maybeData)) return maybeData as T[]
  }
  return []
}
