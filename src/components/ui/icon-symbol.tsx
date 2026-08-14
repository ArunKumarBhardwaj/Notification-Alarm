import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * Standard Material Icon wrapper for Android.
 * See icons at: https://icons.expo.fyi
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: ComponentProps<typeof MaterialIcons>['name'];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={name} style={style} />;
}
