const normalizePublicUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/^https:\/\//i.test(trimmed)) return undefined;
  if (/example\.com|your-domain|placeholder/i.test(trimmed)) return undefined;
  return trimmed;
};

export const LEGAL_URLS = {
  privacyPolicy: normalizePublicUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL),
  termsOfUse: normalizePublicUrl(process.env.EXPO_PUBLIC_TERMS_OF_USE_URL),
};

export const hasConfiguredLegalUrls = (): boolean => Boolean(LEGAL_URLS.privacyPolicy && LEGAL_URLS.termsOfUse);
