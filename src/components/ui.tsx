import { Feather } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, CATEGORY_LABELS, type IngredientCategory } from '../types';
import { colors, fonts } from '../theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.page}>{children}</View>
    </ScrollView>
  );
}

export function TopBar({ title, onSettings }: { title: string; onSettings?: () => void }) {
  return (
    <View style={styles.top}>
      <AppText style={styles.brand}>{title}</AppText>
      {onSettings ? (
        <Pressable accessibilityRole="button" accessibilityLabel="الإعدادات" onPress={onSettings} hitSlop={10}>
          <Feather name="settings" size={22} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'quiet' && styles.buttonQuiet,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
      <AppText
        style={[
          styles.buttonLabel,
          variant === 'secondary' && styles.buttonLabelDark,
          variant === 'quiet' && styles.buttonLabelDark,
          { textAlign: 'center' },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function Field({
  label,
  ...input
}: { label?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      {label ? <AppText style={styles.label}>{label}</AppText> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        {...input}
        style={[styles.input, input.multiline && styles.multiline, input.style]}
      />
    </View>
  );
}

export function DishAvatar({ name, uri, size = 56 }: { name: string; uri?: string | null; size?: number }) {
  const letter = name.trim().charAt(0) || 'ط';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <AppText style={[styles.avatarLetter, { fontSize: size * 0.38, textAlign: 'center' }]}>{letter}</AppText>
      )}
    </View>
  );
}

export function CategoryChips({
  value,
  onChange,
}: {
  value: IngredientCategory;
  onChange: (category: IngredientCategory) => void;
}) {
  return (
    <View style={styles.chips}>
      {CATEGORIES.map((category) => {
        const selected = category === value;
        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            <AppText style={[styles.chipText, selected && styles.chipTextOn, { textAlign: 'center' }]}>
              {CATEGORY_LABELS[category]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Notice({ children }: { children: string }) {
  return <AppText style={styles.notice}>{children}</AppText>;
}

export function EmptyNote({ children }: { children: string }) {
  return <AppText style={styles.empty}>{children}</AppText>;
}

export function IconButton({
  name,
  label,
  onPress,
}: {
  name: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={styles.iconButton}>
      <Feather name={name} size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
  page: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  text: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 40,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonSecondary: {
    backgroundColor: colors.accent,
  },
  buttonQuiet: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.86,
  },
  buttonLabel: {
    fontFamily: fonts.semibold,
    color: colors.buttonText,
    fontSize: 16,
  },
  buttonLabelDark: {
    color: colors.text,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  avatar: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  chipOn: {
    backgroundColor: colors.button,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  chipTextOn: {
    color: colors.buttonText,
  },
  notice: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.muted,
  },
  empty: {
    color: colors.muted,
    fontSize: 15,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
