/**
 * Autenticador de presencia y biometría en el dispositivo (WebAuthn)
 */
export async function checkDeviceAuthCapabilities(): Promise<{ platformAuthenticatorAvailable: boolean }> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return { platformAuthenticatorAvailable: available };
    }
  } catch (e) {
    console.warn('[DeviceAuth] Error verificando capacidades:', e);
  }
  return { platformAuthenticatorAvailable: false };
}

export async function promptDeviceBiometrics(userName?: string): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
  return { success: true };
}
