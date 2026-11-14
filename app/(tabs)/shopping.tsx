import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, CategoryChips, Field, IconButton, Notice, Screen, TopBar } from '../../src/components/ui';
import { formatClock } from '../../src/core/reminder';
import { buildWhatsAppUrl } from '../../src/core/phone';
import { buildShoppingMessage } from '../../src/core/shopping';
import { categoryLabel } from '../../src/core/text';
import { useApp } from '../../src/state/AppProvider';
import type { IngredientCategory } from '../../src/types';
import { colors, fonts, rtl } from '../../src/theme';

export default function ShoppingScreen() {
  const router = useRouter();
  const { shopping, settings, addShopping, toggleShopping, deleteShopping, clearChecked } = useApp();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('staples');
  const [notice, setNotice] = useState<string | null>(null);

  const pending = shopping.filter((item) => !item.checked).length;
  const reminder = settings.reminderEnabled
    ? `التذكير كل يوم الساعة ${formatClock(settings.reminderHour, settings.reminderMinute)}`
    : 'لا يوجد تذكير. يمكن ضبطه من الإعدادات.';

  async function add() {
    if (!name.trim()) {
      setNotice('اكتب اسم الصنف');
      return;
    }
    const added = await addShopping([{ name, amount, category }]);
    setName('');
    setAmount('');
    setNotice(added > 0 ? 'أُضيف إلى القائمة' : 'الصنف موجود في القائمة');
  }

  async function send() {
    const message = buildShoppingMessage(shopping);
    if (!message) {
      setNotice('القائمة فارغة أو كلها منجزة');
      return;
    }
    if (!settings.whatsappNumber.trim()) {
      setNotice('احفظ رقم السوبرماركت من الإعدادات');
      router.push('/settings');
      return;
    }
    const url = buildWhatsAppUrl(settings.whatsappNumber, message);
    if (!url) {
      setNotice('رقم واتساب يحتاج رمز الدولة، مثل +9665xxxxxxx');
      router.push('/settings');
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <Screen>
      <TopBar title="المشتريات" onSettings={() => router.push('/settings')} />
      <View style={styles.composer}>
        <Field value={name} onChangeText={setName} placeholder="صنف جديد" />
        <Field value={amount} onChangeText={setAmount} placeholder="الكمية، اختيارية" />
        <CategoryChips value={category} onChange={setCategory} />
        <Button label="أضف" variant="secondary" onPress={() => void add()} />
      </View>
      {notice ? <Notice>{notice}</Notice> : null}

      {shopping.length === 0 ? <AppText style={styles.empty}>لا أصناف بعد. أضف الناقص من اقتراح اليوم بضغطة واحدة.</AppText> : null}

      {shopping.map((item) => (
        <View key={item.id} style={styles.row}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked }}
            onPress={() => void toggleShopping(item.id)}
            style={[styles.check, item.checked && styles.checkOn]}
          >
            {item.checked ? <AppText style={styles.checkMark}>✓</AppText> : null}
          </Pressable>
          <View style={styles.copy}>
            <AppText style={item.checked ? styles.done : undefined}>
              {item.name}
              {item.amount ? ` — ${item.amount}` : ''}
            </AppText>
            <AppText style={styles.meta}>{categoryLabel(item.category)}</AppText>
          </View>
          <IconButton name="trash-2" label={`حذف ${item.name}`} onPress={() => void deleteShopping(item.id)} />
        </View>
      ))}

      <Button label="إرسال عبر واتساب" onPress={() => void send()} disabled={pending === 0} />
      {shopping.some((item) => item.checked) ? (
        <Button label="مسح المنجز" variant="secondary" onPress={() => void clearChecked()} />
      ) : null}
      <Pressable onPress={() => router.push('/settings')}>
        <AppText style={styles.reminder}>{reminder}</AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    ...rtl,
  },
  empty: {
    color: colors.muted,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...rtl,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.accent,
  },
  checkMark: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  copy: {
    flex: 1,
  },
  done: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  reminder: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
