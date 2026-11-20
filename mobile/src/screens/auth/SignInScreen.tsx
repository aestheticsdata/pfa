import { useSignIn } from "@hooks/useSignIn";
import { BrandHeader } from "@screens/auth/BrandHeader";
import { authText } from "@text/fr/auth";
import { useTheme } from "@theme/useTheme";
import { AppText } from "@ui/AppText";
import { Button } from "@ui/Button";
import { TextField } from "@ui/TextField";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Email + password, once per device: afterwards Face ID / the fingerprint opens the app. No
 * sign-up here — accounts are created on the web.
 */
export const SignInScreen = () => {
  const { layout, space } = useTheme();
  const { submit, pending, error } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const emailError = touched && email.trim() === "" ? authText.signIn.emailMissing : undefined;
  const passwordError = touched && password === "" ? authText.signIn.passwordMissing : undefined;

  const onSubmit = () => {
    setTouched(true);
    if (email.trim() === "" || password === "") return;
    submit({ email: email.trim(), password });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            gap: space.huge,
            padding: layout.screenMargin * 2,
          }}
        >
          <BrandHeader />
          <View style={{ gap: space.md }}>
            <TextField
              accessibilityLabel={authText.signIn.email}
              placeholder={authText.signIn.email}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
              error={emailError}
            />
            <TextField
              accessibilityLabel={authText.signIn.password}
              placeholder={authText.signIn.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              error={passwordError}
            />
            {error ? (
              <AppText
                variant="footnote"
                color="negative"
                accessibilityLiveRegion="assertive"
              >
                {error}
              </AppText>
            ) : null}
          </View>
          <Button
            label={pending ? authText.signIn.submitting : authText.signIn.submit}
            onPress={onSubmit}
            disabled={pending}
            block
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
