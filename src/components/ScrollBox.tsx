import React from 'react';
import { View, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { isWeb } from '../utils/platform';

interface Props {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function ScrollBox({ style, contentContainerStyle, children }: Props) {
  if (isWeb) {
    return (
      <View
        style={[
          {
            flex: 1,
            minHeight: 0,
            overflowY: 'auto' as any,
            height: '100%',
          },
          style,
        ]}
      >
        <View style={[contentContainerStyle, { flexGrow: 1 }]}>{children}</View>
      </View>
    );
  }
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[contentContainerStyle, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
