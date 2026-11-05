import React from 'react';

export const DateTimePicker = (props: any) => {
  return React.createElement('DateTimePicker', {
    ...props,
    testID: props.testID || 'date-time-picker',
  });
};

export default DateTimePicker;
