import { Link } from 'expo-router';
import { AppText, Screen } from '../src/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <AppText>هذه الصفحة غير موجودة.</AppText>
      <Link href="/">
        <AppText>العودة إلى اليوم</AppText>
      </Link>
    </Screen>
  );
}
