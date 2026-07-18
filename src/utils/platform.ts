import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const shouldUseNativeDriver = !isWeb;

export const kavBehavior: 'padding' | 'height' | undefined =
  Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined;