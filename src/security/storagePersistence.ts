/**
 * Asegura la persistencia de almacenamiento en el navegador del médico
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Error solicitando almacenamiento persistente:', e);
    }
  }
  return false;
}
