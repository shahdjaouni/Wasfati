import { Feather } from '@expo/vector-icons';
import type { ComponentType } from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, fonts, rtl } from '../theme';
import { AppText } from './ui';

const LtrView = View as ComponentType<ViewProps & { dir?: 'ltr' }>;

/** Plate coordinates stay physical. Native RTL would otherwise rewrite `left`. */
const physical: ViewStyle = Platform.OS === 'web' ? {} : { direction: 'ltr' };

/** Green header plate from the home mockup: ring, cream disc, and florets. */
export function DishArt({ badge }: { badge: string }) {
  return (
    <View style={styles.art}>
      <View style={styles.badge}>
        <Feather name="star" size={14} color={colors.saffronInk} />
        <AppText style={styles.badgeText}>{badge}</AppText>
      </View>
      <LtrView dir={Platform.OS === 'web' ? 'ltr' : undefined} style={styles.plateBox} pointerEvents="none">
        <View style={styles.ring} />
        <View style={styles.disc} />
        <View style={[styles.dot, styles.dotA]} />
        <View style={[styles.dot, styles.dotB]} />
        <View style={[styles.dot, styles.dotC]} />
        <View style={[styles.dot, styles.dotD]} />
        <View style={[styles.dot, styles.dotE]} />
        <View style={[styles.dot, styles.dotF]} />
      </LtrView>
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    height: 168,
    backgroundColor: colors.primary,
    ...rtl,
  },
  badge: {
    position: 'absolute',
    top: 14,
    start: 14,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBE7C2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...rtl,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.saffronInk,
  },
  plateBox: {
    position: 'absolute',
    left: 24,
    bottom: -30,
    width: 190,
    height: 190,
    zIndex: 1,
    ...physical,
  },
  ring: {
    position: 'absolute',
    left: 7,
    top: 7,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#3B6C47',
  },
  disc: {
    position: 'absolute',
    left: 29,
    top: 29,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#E8DCC0',
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
  },
  dotA: { left: 64, top: 68, width: 28, height: 28, backgroundColor: '#D9A55B' },
  dotB: { left: 99, top: 67, width: 22, height: 22, backgroundColor: '#F2EEE2' },
  dotC: { left: 91, top: 95, width: 26, height: 26, backgroundColor: '#D9A55B' },
  dotD: { left: 65, top: 103, width: 18, height: 18, backgroundColor: '#F2EEE2' },
  dotE: { left: 92, top: 90, width: 8, height: 8, backgroundColor: '#8C5A2B' },
  dotF: { left: 118, top: 94, width: 8, height: 8, backgroundColor: '#8C5A2B' },
});
