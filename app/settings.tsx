import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, Button, Field, Notice, Screen } from '../src/components/ui';
import { normalizePhone } from '../src/core/phone';
import { syncShoppingReminder } from '../src/notifications/reminder';
import { useApp } from '../src/state/AppProvider';
import { colors, fonts } from '../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { ready, settings, apiKey, saveSettings, resetSamples, clearContent } = useApp();
  const [baseUrl, setBaseUrl] = useState(settings.aiBaseUrl);
  const [model, setModel] = useState(settings.aiModel);
  const [key, setKey] = useState(apiKey ?? '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber);
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [hour, setHour] = useState(String(settings.reminderHour));
  const [minute, setMinute] = useState(String(settings.reminderMinute));
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'reset' | 'clear' | null>(null);

  useEffect(() => {
    if (!ready) return;
    setBaseUrl(settings.aiBaseUrl);
    setModel(settings.aiModel);
    setKey(apiKey ?? '');
    setWhatsapp(settings.whatsappNumber);
    setReminderEnabled(settings.reminderEnabled);
    setHour(String(settings.reminderHour));
    setMinute(String(settings.reminderMinute));
  }, [ready, apiKey, settings]);

  async function save() {
    if (whatsapp.trim() && !normalizePhone(whatsapp)) {
      setNotice('اكتب رقم السوبرماركت مع رمز الدولة، مثل +9665xxxxxxx');
      return;
    }
    if (!isHttpUrl(baseUrl)) {
      setNotice('رابط المزود يجب أن يبدأ بـ http أو https');
      return;
    }
    const reminderHour = Number(hour);
    const reminderMinute = Number(minute);
    if (!Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
      setNotice('الساعة من 0 إلى 23');
      return;
    }
    if (!Number.isInteger(reminderMinute) || reminderMinute < 0 || reminderMinute > 59) {
      setNotice('الدقائق من 0 إلى 59');
      return;
    }

    const next = {
      ...settings,
      aiBaseUrl: baseUrl.trim(),
      aiModel: model.trim() || settings.aiModel,
      whatsappNumber: whatsapp.trim(),
      reminderEnabled,
      reminderHour,
      reminderMinute,
    };
    await saveSettings(next, key);
    const reminder = await syncShoppingReminder(next);
    if (reminder.reason === 'denied') {
      setNotice('حُفظت الإعدادات، ولم يُمنح إذن التنبيه');
      return;
    }
    if (reminder.reason === 'web' && reminderEnabled) {
      setNotice('حُفظت الإعدادات. التذكير يعمل على الجوال بعد تثبيت التطبيق');
      return;
    }
    setNotice(key.trim() ? 'تم الحفظ. الاقتراح سيستخدم المزود الذي أدخلته' : 'تم الحفظ. بدون مفتاح نختار الوصفة بالمطابقة المحلية');
  }

  return (
    <Screen>
      <Button label="رجوع" variant="quiet" onPress={() => router.back()} />
      <AppText style={styles.title}>الإعدادات</AppText>

      <View style={styles.card}>
        <AppText style={styles.section}>الذكاء</AppText>
        <Field label="رابط المزود" value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" autoCorrect={false} />
        <Field label="اسم النموذج" value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} />
        <Field
          label="مفتاح الواجهة"
          value={key}
          onChangeText={setKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="يُحفظ في مخزن الجهاز الآمن"
        />
        <AppText style={styles.help}>أي مزود متوافق مع واجهة OpenAI. اترك المفتاح فارغاً للاعتماد على ثلاجتك فقط.</AppText>
      </View>

      <View style={styles.card}>
        <AppText style={styles.section}>السوبرماركت</AppText>
        <Field
          label="رقم واتساب"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          placeholder="+9665xxxxxxx"
        />
        <AppText style={styles.help}>الرسالة تُفتح جاهزة، وأنت من يضغط إرسال.</AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <AppText style={styles.section}>تذكير المشتريات</AppText>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: colors.accent, true: colors.button }}
            thumbColor={colors.white}
          />
        </View>
        <View style={styles.clock}>
          <View style={styles.grow}>
            <Field label="الساعة" value={hour} onChangeText={setHour} keyboardType="number-pad" />
          </View>
          <View style={styles.grow}>
            <Field label="الدقائق" value={minute} onChangeText={setMinute} keyboardType="number-pad" />
          </View>
        </View>
        <AppText style={styles.help}>تنبيه محلي لمراجعة القائمة وإرسالها.</AppText>
      </View>

      {notice ? <Notice>{notice}</Notice> : null}
      <Button label="حفظ" onPress={() => void save()} />

      <View style={styles.card}>
        <AppText style={styles.section}>البيانات</AppText>
        {confirm === 'reset' ? (
          <Button
            label="تأكيد استعادة الأمثلة"
            variant="secondary"
            onPress={() => {
              void resetSamples();
              setConfirm(null);
              setNotice('عادت الوصفات والثلاجة التجريبية');
            }}
          />
        ) : (
          <Button label="استعادة الأمثلة" variant="secondary" onPress={() => setConfirm('reset')} />
        )}
        {confirm === 'clear' ? (
          <Button
            label="تأكيد المسح"
            variant="secondary"
            onPress={() => {
              void clearContent();
              setConfirm(null);
              setNotice('مُسحت الوصفات والثلاجة والمشتريات');
            }}
          />
        ) : (
          <Button label="مسح الوصفات والثلاجة والمشتريات" variant="quiet" onPress={() => setConfirm('clear')} />
        )}
      </View>
    </Screen>
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  help: {
    color: colors.muted,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clock: {
    flexDirection: 'row',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
});
