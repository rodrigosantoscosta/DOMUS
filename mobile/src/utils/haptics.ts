import * as Haptics from 'expo-haptics';

export async function triggerSelectionHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Fallback silencioso em plataformas sem suporte a haptics
  }
}

export async function triggerLightImpact(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Fallback silencioso
  }
}

export async function triggerMediumImpact(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Fallback silencioso
  }
}

export async function triggerSuccessHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Fallback silencioso
  }
}

export async function triggerErrorHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Fallback silencioso
  }
}
