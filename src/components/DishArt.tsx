import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, fonts, rtl } from '../theme';

/** Keep the plate's coordinates physical. Native RTL rewrites `left` into `start`. */
const physical: ViewStyle = Platform.OS === 'web' ? {} : { direction: 'ltr' };
import { AppText } from './ui';

/** Flat plate illustration in the design's geometric style. It is not a photo of the dish. */
export function DishArt({ badge }: { badge: string }) {
  return (
    <View style={styles.art}>
      <View style={styles.badge}>
        <Feather name="grid" size={12} color={colors.primaryDark} />
        <AppText style={styles.badgeText}>{badge}</AppText>
      </View>
      <View style={styles.plate}>
        <View style={[styles.floret, styles.floretA]} />
        <View style={[styles.floret, styles.floretB]} />
        <View style={[styles.floret, styles.floretC]} />
        <View style={[styles.floret, styles.floretD]} />
        <View style={[styles.floret, styles.floretE]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    height: 168,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...rtl,
  },
  badge: {
    position: 'absolute',
    top: 12,
    start: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4EFE4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...rtl,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  plate: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#F6EFE2',
    borderWidth: 6,
    borderColor: '#E7D3B0',
    ...physical,
  },
  floret: {
    position: 'absolute',
    borderRadius: 999,
  },
  floretA: {
    width: 34,
    height: 34,
    backgroundColor: colors.saffronBright,
    top: 22,
    left: 40,
  },
  floretB: {
    width: 28,
    height: 28,
    backgroundColor: '#F8E7C4',
    top: 48,
    left: 22,
  },
  floretC: {
    width: 30,
    height: 30,
    backgroundColor: '#F3D7A2',
    top: 50,
    left: 52,
  },
  floretD: {
    width: 18,
    height: 18,
    backgroundColor: colors.saffron,
    top: 34,
    left: 68,
  },
  floretE: {
    width: 16,
    height: 16,
    backgroundColor: '#FFF9F0',
    top: 58,
    left: 46,
  },
});
