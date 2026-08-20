import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const appConfigPath = path.resolve(process.cwd(), 'app.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8')).expo;
const failures = [];
const warnings = [];

const isPublicHttpsUrl = (value) => (
  typeof value === 'string'
  && /^https:\/\//i.test(value.trim())
  && !/example\.com|your-domain|placeholder/i.test(value)
);

if (!appConfig.android?.package || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(appConfig.android.package)) {
  failures.push('Android application ID is missing or invalid.');
}

if (!Number.isInteger(appConfig.android?.versionCode) || appConfig.android.versionCode < 1) {
  failures.push('Android versionCode must be a positive integer.');
}

const requestedPermissions = appConfig.android?.permissions ?? [];
const prohibitedPermissions = [
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.RECEIVE_BOOT_COMPLETED',
];
for (const permission of prohibitedPermissions) {
  if (requestedPermissions.includes(permission)) {
    failures.push(`Unused high-risk permission is still declared: ${permission}`);
  }
}

const blockedPermissions = appConfig.android?.blockedPermissions ?? [];
if (!blockedPermissions.includes('android.permission.RECORD_AUDIO')) {
  failures.push('Microphone access must stay blocked until a user-facing voice-recording feature is implemented and disclosed.');
}

if (!requestedPermissions.includes('android.permission.CAMERA')) {
  failures.push('Camera permission is required because document scanning is enabled.');
}
if (!requestedPermissions.includes('android.permission.ACCESS_FINE_LOCATION')) {
  failures.push('Foreground fine location is required because route and nearby-load features are enabled.');
}

const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
const termsOfUseUrl = process.env.EXPO_PUBLIC_TERMS_OF_USE_URL;
if (!isPublicHttpsUrl(privacyPolicyUrl)) {
  failures.push('EXPO_PUBLIC_PRIVACY_POLICY_URL must be a real public HTTPS URL, not a placeholder.');
}
if (!isPublicHttpsUrl(termsOfUseUrl)) {
  failures.push('EXPO_PUBLIC_TERMS_OF_USE_URL must be a real public HTTPS URL, not a placeholder.');
}

const extras = appConfig.extra ?? {};
if (!extras.admobAppIdAndroid) {
  warnings.push('AdMob Android app ID is blank. Keep ads disabled in production or configure a valid app ID before enabling ads.');
}
if (!extras.sentryDsn) {
  warnings.push('Sentry DSN is blank. Crash reporting is not configured for the release build.');
}
if (!extras.firebaseProjectId) {
  warnings.push('Firebase project ID is blank. Push-notification release setup is incomplete.');
}

console.log('\nPrince Haul Intelligence Android Release Readiness');
console.log('================================================');
console.log(`Package: ${appConfig.android?.package ?? 'missing'}`);
console.log(`Version: ${appConfig.version ?? 'missing'} (${appConfig.android?.versionCode ?? 'missing'})`);
console.log('Target SDK: resolved by the installed Expo SDK during Android prebuild.');
console.log(`Requested permissions: ${requestedPermissions.join(', ') || 'none'}`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (failures.length > 0) {
  console.error('\nRelease blockers:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nRelease blockers: none');
}
