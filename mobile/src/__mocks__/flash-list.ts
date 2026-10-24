import React from 'react';

export const FlashList = (props: any) => {
  const {
    data,
    renderItem,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
    ...rest
  } = props;
  const header =
    typeof ListHeaderComponent === 'function'
      ? React.createElement(ListHeaderComponent)
      : ListHeaderComponent;
  const empty =
    typeof ListEmptyComponent === 'function'
      ? React.createElement(ListEmptyComponent)
      : ListEmptyComponent;
  const footer =
    typeof ListFooterComponent === 'function'
      ? React.createElement(ListFooterComponent)
      : ListFooterComponent;
  const items =
    Array.isArray(data) && data.length > 0
      ? data.map((item: any, index: number) =>
          React.createElement(
            React.Fragment,
            { key: props.keyExtractor ? props.keyExtractor(item, index) : index },
            renderItem({ item, index, target: 'Cell' })
          )
        )
      : empty;

  return React.createElement('FlashList', rest, header, items, footer);
};

export default {
  FlashList,
};
