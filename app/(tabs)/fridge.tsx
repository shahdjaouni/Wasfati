import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, CategoryChips, Field, IconButton, Notice, Screen, TopBar } from '../../src/components/ui';
import { useApp } from '../../src/state/AppProvider';
import { CATEGORIES, CATEGORY_LABELS, type IngredientCategory } from '../../src/types';
import { colors, fonts, rtl } from '../../src/theme';

export default function FridgeScreen() {
  const router = useRouter();
  const { pantry, addPantryItem, deletePantryItem } = useApp();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('vegetables');
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) {
      setNotice('اكتب اسم المكون');
      return;
    }
    await addPantryItem({ name, amount, category });
    setName('');
    setAmount('');
    setNotice('أُضيف إلى الثلاجة');
  }

  return (
    <Screen>
      <TopBar title="ثلاجتي" onSettings={() => router.push('/settings')} />
      <View style={styles.composer}>
        <Field value={name} onChangeText={setName} placeholder="بندورة، أرز، كمون..." />
        <Field value={amount} onChangeText={setAmount} placeholder="الكمية، اختيارية" />
        <CategoryChips value={category} onChange={setCategory} />
        <Button label="أضف للثلاجة" onPress={() => void add()} />
      </View>
      {notice ? <Notice>{notice}</Notice> : null}
      <AppText style={styles.hint}>خضار، مونة مثل الأرز والزيت، بهارات، وسوائل مثل الحليب والكريمة.</AppText>

      {CATEGORIES.map((group) => {
        const items = pantry.filter((item) => item.category === group);
        return (
          <View key={group} style={styles.group}>
            <AppText style={styles.groupTitle}>{CATEGORY_LABELS[group]}</AppText>
            {items.length === 0 ? <AppText style={styles.empty}>لا شيء هنا</AppText> : null}
            {items.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.copy}>
                  <AppText>{item.name}</AppText>
                  {item.amount ? <AppText style={styles.amount}>{item.amount}</AppText> : null}
                </View>
                {confirmId === item.id ? (
                  <Button
                    label="تأكيد الحذف"
                    variant="quiet"
                    onPress={() => {
                      void deletePantryItem(item.id);
                      setConfirmId(null);
                    }}
                  />
                ) : (
                  <IconButton name="trash-2" label={`حذف ${item.name}`} onPress={() => setConfirmId(item.id)} />
                )}
              </View>
            ))}
          </View>
        );
      })}
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
  hint: {
    color: colors.muted,
    fontSize: 14,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...rtl,
  },
  copy: {
    flex: 1,
  },
  amount: {
    color: colors.muted,
    fontSize: 13,
  },
});
