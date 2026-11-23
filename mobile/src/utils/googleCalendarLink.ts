import { Linking } from 'react-native';

export function validarUrlGoogleCalendarHttps(url?: string | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const limpa = url.trim();
  if (!limpa) {
    return null;
  }
  try {
    const parsed = new URL(limpa);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Valida URL HTTPS do Google Calendar e aciona o navegador/app externo.
 * Em cliques manuais de fallback, tenta openURL diretamente para contornar restricoes de canOpenURL no Android 11+.
 */
export async function abrirUrlGoogleCalendar(
  url?: string | null,
  opcoes?: { ignorarCanOpenUrl?: boolean }
): Promise<boolean> {
  const urlSegura = validarUrlGoogleCalendarHttps(url);
  if (!urlSegura) {
    return false;
  }

  try {
    if (!opcoes?.ignorarCanOpenUrl) {
      const podeAbrir = await Linking.canOpenURL(urlSegura);
      if (!podeAbrir) {
        return false;
      }
    }
    await Linking.openURL(urlSegura);
    return true;
  } catch {
    return false;
  }
}
