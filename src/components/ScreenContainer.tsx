import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { isWeb } from '../utils/platform';

interface Props {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function ScreenContainer({ style, children }: Props) {
  if (isWeb) {
    return (
      <View
        style={[
          {
            position: 'fixed' as any,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex' as any,
            flexDirection: 'column',
            overflow: 'hidden' as any,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}
