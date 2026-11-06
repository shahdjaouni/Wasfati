import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen } from '../../src/components/ui';
import { colors, fonts } from '../../src/theme';

export default function PlanScreen() {
  const router = useRouter();

  return (
    <Screen>
      <AppText style={styles.title}>الخطة</AppText>
      <View style={styles.card}>
        <AppText style={styles.body}>
          خطة الأسبوع لسه مش جاهزة بهالنسخة. ما في وجبات محفوظة للأيام، وما منعرض خطة شكلها شغالة وهي مش كذلك.
        </AppText>
        <AppText style={styles.body}>اقتراح اليوم موجود بتاب اليوم، وتقدرين ترجعيله الآن.</AppText>
        <Button label="ارجعي لليوم" onPress={() => router.push('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
  },
});
