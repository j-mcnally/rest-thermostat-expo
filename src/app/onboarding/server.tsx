import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { createNleClient } from '@/lib/api/nle-client';
import {
  authBasic,
  authBearer,
  authCfServiceToken,
  AuthNone,
  headersFor,
  type AuthConfig,
  type AuthTag,
} from '@/lib/auth/config';
import { isNleError, networkErrorCopy } from '@/lib/errors/nle-error';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';
import { normalizeServerUrl } from '@/lib/util/normalize-url';

const AUTH_OPTIONS: { tag: AuthTag; label: string }[] = [
  { tag: 'none', label: 'None' },
  { tag: 'basic', label: 'Basic' },
  { tag: 'bearer', label: 'Bearer' },
  { tag: 'cf_service_token', label: 'Cloudflare Access' },
];

export default function ServerSetupScreen() {
  const setServerUrl = useConfigStore((s) => s.setServerUrl);
  const setAuth = useConfigStore((s) => s.setAuth);

  const [urlInput, setUrlInput] = useState('');
  const [authTag, setAuthTag] = useState<AuthTag>('none');
  const [basicUser, setBasicUser] = useState('');
  const [basicPass, setBasicPass] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [cfId, setCfId] = useState('');
  const [cfSecret, setCfSecret] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth: AuthConfig = useMemo(() => {
    switch (authTag) {
      case 'none':
        return AuthNone;
      case 'basic':
        return authBasic(basicUser, basicPass);
      case 'bearer':
        return authBearer(bearerToken);
      case 'cf_service_token':
        return authCfServiceToken(cfId, cfSecret);
    }
  }, [authTag, basicUser, basicPass, bearerToken, cfId, cfSecret]);

  async function handleTestAndContinue() {
    setError(null);
    let normalized: string;
    try {
      normalized = normalizeServerUrl(urlInput);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid URL');
      return;
    }
    setTesting(true);
    const client = createNleClient({
      baseUrl: normalized,
      authHeaders: headersFor(auth),
    });
    try {
      await client.getDevices();
      await setServerUrl(normalized);
      await setAuth(auth);
      router.replace('/onboarding/device-picker');
    } catch (e) {
      if (isNleError(e)) {
        switch (e.type) {
          case 'auth':
            setError(
              e.isCloudflareAccess
                ? 'Cloudflare Access rejected the credentials.'
                : `Auth failed (HTTP ${e.statusCode}).`,
            );
            break;
          case 'network':
            setError(networkErrorCopy(e.kind));
            break;
          case 'server':
            setError(`Server error (HTTP ${e.statusCode}).`);
            break;
          case 'client':
            setError(`Request rejected (HTTP ${e.statusCode}).`);
            break;
          case 'rateLimit':
            setError('Rate-limited by the server.');
            break;
          case 'parse':
            setError('Server replied with an unexpected response.');
            break;
        }
      } else {
        setError(e instanceof Error ? e.message : 'Connection failed.');
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <EmberBackground mode="neutral">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[EmberTypography.labelSmall(), styles.kicker]}>
              STEP 1 OF 2
            </Text>
            <Text style={[EmberTypography.headlineLarge(), styles.heading]}>
              Connect to your server
            </Text>

            <Field
              label="Server URL"
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="http://192.168.1.50:8082"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={[EmberTypography.labelSmall(), styles.sectionLabel]}>
              AUTH
            </Text>
            <View style={styles.authRow}>
              {AUTH_OPTIONS.map((opt) => {
                const active = opt.tag === authTag;
                return (
                  <Pressable
                    key={opt.tag}
                    onPress={() => setAuthTag(opt.tag)}
                    style={[
                      styles.authChip,
                      active && styles.authChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        EmberTypography.bodySmall(
                          active
                            ? Colors.textPrimary
                            : Colors.textSecondary,
                        ),
                        active && { fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {authTag === 'basic' && (
              <>
                <Field
                  label="Username"
                  value={basicUser}
                  onChangeText={setBasicUser}
                  autoCapitalize="none"
                />
                <Field
                  label="Password"
                  value={basicPass}
                  onChangeText={setBasicPass}
                  secureTextEntry
                />
              </>
            )}

            {authTag === 'bearer' && (
              <Field
                label="Bearer token"
                value={bearerToken}
                onChangeText={setBearerToken}
                autoCapitalize="none"
                secureTextEntry
              />
            )}

            {authTag === 'cf_service_token' && (
              <>
                <Field
                  label="CF-Access-Client-Id"
                  value={cfId}
                  onChangeText={setCfId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Field
                  label="CF-Access-Client-Secret"
                  value={cfSecret}
                  onChangeText={setCfSecret}
                  autoCapitalize="none"
                  secureTextEntry
                />
              </>
            )}

            {error && (
              <Text
                style={[
                  EmberTypography.bodySmall(),
                  styles.error,
                  { color: '#ff8a8a' },
                ]}
              >
                {error}
              </Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={handleTestAndContinue}
              disabled={testing || urlInput.trim().length === 0}
              style={({ pressed }) => [
                styles.cta,
                (testing || urlInput.trim().length === 0) && { opacity: 0.4 },
                pressed && { opacity: 0.85 },
              ]}
            >
              {testing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[EmberTypography.labelLarge(), styles.ctaLabel]}>
                  TEST + CONTINUE
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </EmberBackground>
  );
}

function Field({
  label,
  ...inputProps
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[EmberTypography.labelSmall(), styles.fieldLabel]}>
        {label}
      </Text>
      <TextInput
        {...inputProps}
        style={[styles.fieldInput, EmberTypography.bodyLarge()]}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 32, paddingTop: 16, gap: 16, paddingBottom: 32 },
  kicker: { textTransform: 'uppercase', color: Colors.textTertiary },
  heading: { marginBottom: 8 },
  sectionLabel: { marginTop: 8 },
  authRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  authChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.textDisabled,
  },
  authChipActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: '#ffffff10',
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { textTransform: 'uppercase' },
  fieldInput: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.textDisabled,
    paddingVertical: 10,
    color: Colors.textPrimary,
  },
  error: { paddingVertical: 6 },
  actions: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  cta: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: { color: '#000', textTransform: 'uppercase' },
});
