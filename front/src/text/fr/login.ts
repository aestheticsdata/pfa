const login = {
  brand: {
    title: "Personal Finance Assistant",
    subtitle: "Chaque euro à sa place.",
  },
  header: {
    aboutTab: "À propos",
  },
  actions: {
    signIn: "Se connecter",
    createAccount: "Créer un compte",
  },
  fields: {
    emailLabel: "Email",
    emailPlaceholder: "nom@exemple.com",
    passwordLabel: "Mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    currencyLabel: "Devise",
  },
  password: {
    show: "Afficher le mot de passe",
    hide: "Masquer le mot de passe",
  },
  validation: {
    emailRequired: "Email requis",
    emailInvalid: "Email invalide",
    passwordRequired: "Mot de passe requis",
    confirmRequired: "Confirmation requise",
    passwordMismatch: "Les mots de passe ne correspondent pas",
  },
  errors: {
    invalidCredentials: "Email ou mot de passe incorrect.",
    generic: "Une erreur est survenue. Réessayer.",
  },
  switch: {
    toSignup: "Pas encore de compte ?",
    toLogin: "Déjà un compte ?",
  },
  forgotPassword: {
    title: "Mot de passe oublié ?",
    subtitle: "Un lien de réinitialisation va être envoyé.",
    submit: "Réinitialiser le mot de passe",
    backToLogin: "Retour à la connexion",
  },
  signup: {
    emailAlreadyExists: "Un compte existe déjà avec cet email.",
    error: "La création du compte a échoué. Réessayer.",
  },
  resetPassword: {
    toastSuccess: "Un nouveau mot de passe a été envoyé.",
    toastError: "Le mot de passe n'a pas pu être réinitialisé",
    emailSubject: "PFA - changement de mot de passe",
  },
};

export default login;
