import { Redirect } from 'expo-router';
import { hasCompletedOnboarding } from '@/lib/storage';

export default function Index() {
  if (hasCompletedOnboarding()) {
    return <Redirect href="/apps" />;
  }
  return <Redirect href="/onboarding" />;
}
