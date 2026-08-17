import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SFSymbol, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * SF Symbol → Material Icons names, so callers can use one name on both
 * platforms. Add an entry here when a screen needs a new icon.
 * See Material icons at: https://icons.expo.fyi
 */
const MAPPING: Partial<Record<SFSymbol, MaterialIconName>> = {
  'chevron.right': 'chevron-right',
  'exclamationmark.triangle.fill': 'warning',
};

/**
 * Cross-platform icon: SF Symbols on iOS, Material Icons everywhere else.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SFSymbol;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] ?? 'help-outline'}
      style={style}
    />
  );
}
