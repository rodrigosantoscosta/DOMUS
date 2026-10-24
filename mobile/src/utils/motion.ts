import { Easing } from 'react-native-reanimated';

export const EASE_OUT = Easing.out(Easing.quad);
export const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
export const EASE_SHEET = Easing.bezier(0.25, 1, 0.5, 1);

export function projectVelocity(velocity: number, decelerationRate = 0.998): number {
  'worklet';
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  'worklet';
  return (1.0 - (1.0 / ((overshoot * constant / dimension) + 1.0))) * dimension;
}
