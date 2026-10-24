import React from 'react';

export const View = (props: any) => React.createElement('View', props, props.children);
export const Text = (props: any) => React.createElement('Text', props, props.children);
export const TouchableOpacity = (props: any) => React.createElement('TouchableOpacity', props, props.children);
export const Pressable = (props: any) => React.createElement('Pressable', props, props.children);
export const TextInput = (props: any) => React.createElement('TextInput', props);
export const ScrollView = (props: any) => React.createElement('ScrollView', props, props.children);
export const RefreshControl = (props: any) => React.createElement('RefreshControl', props);
export const ActivityIndicator = (props: any) => React.createElement('ActivityIndicator', props);
export const SafeAreaView = (props: any) => React.createElement('SafeAreaView', props, props.children);
export const Modal = (props: any) => React.createElement('Modal', props, props.children);

export const Dimensions = {
  get: () => ({ width: 390, height: 844 }),
};

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (style: any): Record<string, any> => {
    if (!style) return {};
    if (!Array.isArray(style)) {
      return typeof style === 'object' ? style : {};
    }
    const result: Record<string, any> = {};
    for (let i = 0; i < style.length; i++) {
      const computed = StyleSheet.flatten(style[i]);
      if (computed) {
        Object.assign(result, computed);
      }
    }
    return result;
  },
};

export const Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios ?? obj.default,
};

export const Alert = {
  alert: jest.fn(),
};

export const StatusBar = (props: any) => React.createElement('StatusBar', props);

export const Linking = {
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

export default {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
  StatusBar,
  Linking,
};
