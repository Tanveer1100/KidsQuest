import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/expo';
import colors from '@/constants/colors';

export default function SignedInLayout() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.light.background } }} />;
}
