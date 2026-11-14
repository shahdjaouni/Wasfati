import type { ComponentType } from 'react';
import { Platform, View, type ViewProps, type ViewStyle } from 'react-native';
import type { PlateColors } from './recipes';

const LtrView = View as ComponentType<ViewProps & { dir?: 'ltr' }>;

const ltr: ViewStyle = Platform.OS === 'web' ? {} : { direction: 'ltr' };

/** The small plate drawn on a recipe card. Positions stay on the left of the disc. */
export function PlateMark({ colors, size = 84 }: { colors: PlateColors; size?: number }) {
  const unit = size / 84;
  return (
    <LtrView dir="ltr" style={[{ width: size, height: size }, ltr]}>
      <View
        style={{
          position: 'absolute',
          start: 4 * unit,
          top: 4 * unit,
          width: 76 * unit,
          height: 76 * unit,
          borderRadius: 38 * unit,
          backgroundColor: colors.ring,
        }}
      />
      <View
        style={{
          position: 'absolute',
          start: 15 * unit,
          top: 15 * unit,
          width: 54 * unit,
          height: 54 * unit,
          borderRadius: 27 * unit,
          backgroundColor: colors.food,
        }}
      />
      <View
        style={{
          position: 'absolute',
          start: 28 * unit,
          top: 30 * unit,
          width: 12 * unit,
          height: 12 * unit,
          borderRadius: 6 * unit,
          backgroundColor: colors.dot,
        }}
      />
      <View
        style={{
          position: 'absolute',
          start: 45 * unit,
          top: 43 * unit,
          width: 10 * unit,
          height: 10 * unit,
          borderRadius: 5 * unit,
          backgroundColor: colors.dot,
        }}
      />
    </LtrView>
  );
}
