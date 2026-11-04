import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors, fonts } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.button,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
          direction: 'rtl',
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 12,
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
