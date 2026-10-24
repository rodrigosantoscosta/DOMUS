import React from 'react';

export const SafeAreaProvider = (props: any) =>
  React.createElement('SafeAreaProvider', props, props.children);

export const SafeAreaView = (props: any) =>
  React.createElement('SafeAreaView', props, props.children);

export const useSafeAreaInsets = () => ({
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
});

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
};
