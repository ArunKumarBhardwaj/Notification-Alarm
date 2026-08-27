import { Redirect } from 'expo-router';
import { shouldShowSetupScreen } from '@/lib/setup-checklist';
import { hasCompletedOnboarding } from '@/lib/storage';

export default function Index() {
  if (!hasCompletedOnboarding()) {
    return <Redirect href="/onboarding" />;
  }
  if (shouldShowSetupScreen()) {
    return <Redirect href="/setup" />;
  }
  return <Redirect href="/apps" />;
}
