import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/ui';
import { colors, fonts, rtl } from '../../src/theme';

const TAB_CONTENT_HEIGHT = 58;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Sit above the gesture bar or 3-button nav, plus a little air so labels are not flush with it.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 0) + 8;

  return (
    <Tabs
      safeAreaInsets={{ bottom: bottomInset }}
      screenOptions={{
        headerShown: false,
        sceneStyle: [{ backgroundColor: colors.background }, rtl],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_CONTENT_HEIGHT + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          elevation: 0,
          shadowOpacity: 0,
          ...rtl,
        },
        tabBarLabel: ({ color, children }) => (
          <AppText
            numberOfLines={1}
            style={{
              color: String(color),
              fontFamily: fonts.semibold,
              fontSize: 11,
              lineHeight: 16,
              textAlign: 'center',
              width: '100%',
            }}
          >
            {children}
          </AppText>
        ),
        tabBarItemStyle: {
          paddingTop: 2,
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'اليوم',
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused}>
              <Feather name="sun" size={18} color={String(color)} />
            </TabGlyph>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'الخطة',
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused}>
              <Feather name="calendar" size={18} color={String(color)} />
            </TabGlyph>
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'وصفاتي',
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused}>
              <Feather name="book-open" size={18} color={String(color)} />
            </TabGlyph>
          ),
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'ثلاجتي',
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused}>
              <FridgeIcon color={String(color)} />
            </TabGlyph>
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'المشتريات',
          tabBarIcon: ({ color, focused }) => (
            <TabGlyph focused={focused}>
              <Feather name="shopping-bag" size={18} color={String(color)} />
            </TabGlyph>
          ),
        }}
      />
    </Tabs>
  );
}

function TabGlyph({ focused, children }: { focused: boolean; children: ReactNode }) {
  return <View style={[styles.capsule, focused && styles.capsuleOn]}>{children}</View>;
}

function FridgeIcon({ color }: { color: string }) {
  return (
    <View style={[styles.fridge, { borderColor: color }]}>
      <View style={[styles.fridgeTop, { borderBottomColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleOn: {
    backgroundColor: colors.soft,
  },
  fridge: {
    width: 16,
    height: 18,
    borderWidth: 1.6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fridgeTop: {
    height: 6,
    borderBottomWidth: 1.6,
  },
});
