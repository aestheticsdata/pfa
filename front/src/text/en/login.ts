import type frLogin from "@text/fr/login";

const login: typeof frLogin = {
  brand: {
    title: "Personal Finance Assistant",
    subtitle: "Every euro in its place.",
  },
  header: {
    aboutTab: "About",
  },
  actions: {
    signIn: "Sign in",
    createAccount: "Create an account",
  },
  fields: {
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    currencyLabel: "Currency",
  },
  password: {
    show: "Show password",
    hide: "Hide password",
  },
  validation: {
    emailRequired: "Email required",
    emailInvalid: "Invalid email",
    passwordRequired: "Password required",
    confirmRequired: "Confirmation required",
    passwordMismatch: "Passwords do not match",
  },
  errors: {
    invalidCredentials: "Incorrect email or password.",
    generic: "An error occurred. Try again.",
  },
  switch: {
    toSignup: "No account yet?",
    toLogin: "Already have an account?",
  },
  forgotPassword: {
    title: "Forgot password?",
    subtitle: "A reset link will be sent.",
    submit: "Reset password",
    backToLogin: "Back to sign in",
  },
  signup: {
    emailAlreadyExists: "An account already exists with this email.",
    error: "Account creation failed. Try again.",
  },
  resetPassword: {
    toastSuccess: "A new password has been sent.",
    toastError: "The password could not be reset",
    emailSubject: "PFA - password change",
  },
};

export default login;
