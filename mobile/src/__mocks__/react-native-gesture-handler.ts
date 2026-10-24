import React from 'react';

export const GestureHandlerRootView = (props: any) =>
  React.createElement('GestureHandlerRootView', props, props.children);

export const GestureDetector = (props: any) =>
  React.createElement('GestureDetector', props, props.children);

export const Gesture = {
  Pan: () => {
    const builder: any = {
      activeOffsetY: () => builder,
      activeOffsetX: () => builder,
      onStart: () => builder,
      onUpdate: () => builder,
      onEnd: () => builder,
      onFinalize: () => builder,
    };
    return builder;
  },
};

export default {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
};
