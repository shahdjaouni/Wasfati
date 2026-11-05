import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, rtl } from '../../src/theme';

const TAB_CONTENT_HEIGHT = 52;

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
        tabBarActiveTintColor: colors.button,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_CONTENT_HEIGHT + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          ...rtl,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          writingDirection: 'rtl',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'اليوم',
          tabBarIcon: ({ color }) => <Feather name="sun" size={20} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'وصفاتي',
          tabBarIcon: ({ color }) => <Feather name="book-open" size={20} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'ثلاجتي',
          tabBarIcon: ({ color }) => <Feather name="archive" size={20} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'المشتريات',
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={20} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
