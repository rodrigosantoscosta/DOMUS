import React from 'react';

const createIconMock = (family: string) => {
  return function IconMock(props: any) {
    return React.createElement(family, {
      ...props,
      testID: props.testID || `icon-${props.name}`,
    });
  };
};

export const Ionicons = createIconMock('Ionicons');
export const MaterialIcons = createIconMock('MaterialIcons');
export const FontAwesome = createIconMock('FontAwesome');
export const Feather = createIconMock('Feather');

export default {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  Feather,
};
