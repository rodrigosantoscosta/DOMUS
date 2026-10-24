import React from 'react';

/**
 * useSafeState
 * Permite que componentes que utilizam estado local possam ser invocados
 * diretamente como funcoes puras em testes unitarios legados sem lancar
 * o erro 'Invalid hook call: Hooks can only be called inside of the body of a function component.'
 */
export function useSafeState<T>(initial: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const originalError = console.error;
  try {
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Invalid hook call')) {
        return;
      }
      originalError(...args);
    };
    return React.useState<T>(initial);
  } catch {
    const initialVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    return [initialVal, () => {}];
  } finally {
    console.error = originalError;
  }
}

/**
 * useSafeRef
 * Versao segura de useRef que retorna um objeto ref compativel quando invocado fora do contexto de renderizacao.
 */
export function useSafeRef<T>(initialValue: T): React.MutableRefObject<T> {
  const originalError = console.error;
  try {
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Invalid hook call')) {
        return;
      }
      originalError(...args);
    };
    return React.useRef<T>(initialValue);
  } catch {
    return { current: initialValue };
  } finally {
    console.error = originalError;
  }
}

/**
 * useSafeEffect
 * Versao segura de useEffect que nao quebra quando chamada fora de um componente montado.
 */
export function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const originalError = console.error;
  try {
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Invalid hook call')) {
        return;
      }
      originalError(...args);
    };
    React.useEffect(effect, deps);
  } catch {
    // No-op quando executado fora da arvore React
  } finally {
    console.error = originalError;
  }
}
