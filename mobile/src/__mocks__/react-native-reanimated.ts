import React from 'react';

export const Animated = {
  View: (props: any) => React.createElement('Animated.View', props, props.children),
  Text: (props: any) => React.createElement('Animated.Text', props, props.children),
  ScrollView: (props: any) => React.createElement('Animated.ScrollView', props, props.children),
  createAnimatedComponent: (c: any) => c,
};

export const useSharedValue = (init: any) => {
  let val = init;
  return {
    get value() {
      return val;
    },
    set value(v: any) {
      val = v;
    },
    get: () => val,
    set: (v: any) => {
      val = typeof v === 'function' ? v(val) : v;
    },
  };
};

export const useAnimatedStyle = (fn: () => any) => {
  try {
    return fn();
  } catch {
    return {};
  }
};

export const useReducedMotion = () => false;

export const withSpring = (toValue: any, _config?: any, cb?: (finished?: boolean) => void) => {
  if (cb) cb(true);
  return toValue;
};

export const withTiming = (toValue: any, _config?: any, cb?: (finished?: boolean) => void) => {
  if (cb) cb(true);
  return toValue;
};

export const runOnJS = (fn: any) => fn;

export const Easing = {
  bezier: () => (t: number) => t,
  out: (fn: any) => fn,
  quad: (t: number) => t,
};

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export const interpolate = (v: number, _input: number[], output: number[]) => output[0] ?? v;

export const FadeInDown = {
  duration: () => ({
    delay: () => ({}),
  }),
};

export const FadeOutUp = {
  duration: () => ({}),
};

export const LinearTransition = {
  duration: () => ({}),
};

export default {
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  Extrapolation,
  interpolate,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
};
