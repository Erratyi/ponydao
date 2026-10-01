import { islands } from '../data.js';
export { islands };
export const actor = (mode, entityId) => ({mode, entityId});
export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key)};
}
export async function loadModule(path) {
  try { return await import(path); } catch (e) { if (e.code === 'ERR_MODULE_NOT_FOUND') return {}; throw e; }
}
export const meta = (id = 'test') => ({id, now:'2026-10-01T00:00:00Z'});
