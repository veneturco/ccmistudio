/**
 * Servicio de presencia y estado de conexión para sesiones clínicas
 */
export async function markUserOffline(user: any, sessionId: string): Promise<void> {
  // Marcado defensivo no bloqueante
}

export function getOrCreateClientSessionId(): string {
  if (typeof window === 'undefined') return 'session-server';
  try {
    let id = sessionStorage.getItem('ccmi_session_id');
    if (!id) {
      id = `ccmi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('ccmi_session_id', id);
    }
    return id;
  } catch {
    return `ccmi_${Date.now()}`;
  }
}
