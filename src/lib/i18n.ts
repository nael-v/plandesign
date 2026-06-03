export const LOCALE_COOKIE = "pd-locale";
export const DEFAULT_LOCALE = "en" as const;

export type AppLocale = "en" | "he";

type LocalizedValue = {
  en: string;
  he: string;
};

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === "he" ? "he" : "en";
}

export function localeDir(locale: AppLocale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}

export function intlLocale(locale: AppLocale): string {
  return locale === "he" ? "he-IL" : "en-US";
}

export function localizedValue(locale: AppLocale, value: LocalizedValue): string {
  return value[locale];
}

export function formatDate(
  locale: AppLocale,
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(new Date(value));
}

export function formatDateTime(locale: AppLocale, value: string | number | Date): string {
  return formatDate(locale, value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(locale: AppLocale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

export function formatCurrency(
  locale: AppLocale,
  value: number,
  currency = "USD",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

function humanizeValue(value: string): string {
  return value.replaceAll("_", " ");
}

const CLIENT_STATUS_LABELS: Record<string, LocalizedValue> = {
  active: { en: "Active", he: "פעיל" },
  inactive: { en: "Inactive", he: "לא פעיל" },
  prospect: { en: "Prospect", he: "ליד" },
};

const PROJECT_STATUS_LABELS: Record<string, LocalizedValue> = {
  planning: { en: "Planning", he: "בתכנון" },
  active: { en: "Active", he: "פעיל" },
  on_hold: { en: "On hold", he: "בהמתנה" },
  completed: { en: "Completed", he: "הושלם" },
  archived: { en: "Archived", he: "בארכיון" },
};

const PROJECT_STAGE_LABELS: Record<string, LocalizedValue> = {
  discovery: { en: "Discovery", he: "גילוי" },
  design: { en: "Design", he: "תכנון" },
  approval: { en: "Approval", he: "אישור" },
  execution: { en: "Execution", he: "ביצוע" },
  handover: { en: "Handover", he: "מסירה" },
};

const SUPPLIER_CATEGORY_LABELS: Record<string, LocalizedValue> = {
  electrical: { en: "Electrical", he: "חשמל" },
  furniture: { en: "Furniture", he: "ריהוט" },
  materials: { en: "Materials", he: "חומרים" },
  plumbing: { en: "Plumbing", he: "אינסטלציה" },
  contractors: { en: "Contractors", he: "קבלנים" },
};

const PROCUREMENT_STATUS_LABELS: Record<string, LocalizedValue> = {
  requested: { en: "Requested", he: "התבקש" },
  approved: { en: "Approved", he: "אושר" },
  rejected: { en: "Rejected", he: "נדחה" },
  ordered: { en: "Ordered", he: "הוזמן" },
  delivered: { en: "Delivered", he: "סופק" },
};

const INVOICE_STATUS_LABELS: Record<string, LocalizedValue> = {
  draft: { en: "Draft", he: "טיוטה" },
  sent: { en: "Sent", he: "נשלח" },
  paid: { en: "Paid", he: "שולם" },
  overdue: { en: "Overdue", he: "באיחור" },
  canceled: { en: "Canceled", he: "בוטל" },
};

const PAYMENT_STATUS_LABELS: Record<string, LocalizedValue> = {
  pending: { en: "Pending", he: "ממתין" },
  approved: { en: "Approved", he: "אושר" },
  paid: { en: "Paid", he: "שולם" },
  failed: { en: "Failed", he: "נכשל" },
};

function localizeMapValue(locale: AppLocale, map: Record<string, LocalizedValue>, value: string): string {
  return map[value] ? localizedValue(locale, map[value]) : humanizeValue(value);
}

export function localizeClientStatus(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, CLIENT_STATUS_LABELS, value);
}

export function localizeProjectStatus(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, PROJECT_STATUS_LABELS, value);
}

export function localizeProjectStage(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, PROJECT_STAGE_LABELS, value);
}

export function localizeSupplierCategory(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, SUPPLIER_CATEGORY_LABELS, value);
}

export function localizeProcurementStatus(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, PROCUREMENT_STATUS_LABELS, value);
}

export function localizeInvoiceStatus(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, INVOICE_STATUS_LABELS, value);
}

export function localizePaymentStatus(locale: AppLocale, value: string): string {
  return localizeMapValue(locale, PAYMENT_STATUS_LABELS, value);
}

const translations = {
  en: {
    planDesignPlatform: "PlanDesign platform",
    welcomeBack: "Welcome back, {name}",
    roleAwareLayout: "Role-aware SaaS layout for studio operations",
    signOut: "Sign out",
    signIn: "Sign in",
    dashboard: "Dashboard",
    unreadNotifications: "{count} unread notifications",
    commandPalette: "Ctrl/Cmd + K command palette",
    appRouter: "App Router",
    prismaReady: "Prisma ready",
    postgresReady: "PostgreSQL ready",
    expand: "Expand",
    collapse: "Collapse",
    enterpriseArchitecture: "Enterprise architecture for design operations.",
    sidebarFooter: "Modular feature slices keep code scalable as the team grows.",
    loginTitle: "Welcome back",
    loginDesc: "Sign in to your account to continue.",
    emailAddress: "Email address",
    password: "Password",
    invalidCredentials: "Invalid email or password. Please try again.",
    somethingWrong: "Something went wrong. Please try again.",
    signingIn: "Signing in...",
    dontHaveAccount: "Don't have an account?",
    createOne: "Create one",
    registerTitle: "Create your account",
    registerDesc: "Join PlanDesign to manage your architectural projects.",
    fullName: "Full name",
    confirmPassword: "Confirm password",
    passwordsNoMatch: "Passwords do not match.",
    creatingAccount: "Creating account...",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
    yourName: "Your name",
    minEight: "Min 8 characters",
    repeatPassword: "Repeat your password",
    hebrew: "עברית",
    english: "English"
  },
  he: {
    planDesignPlatform: "פלטפורמת PlanDesign",
    welcomeBack: "ברוך שובך, {name}",
    roleAwareLayout: "מערכת SaaS מותאמת תפקידים לניהול פעילות סטודיו",
    signOut: "התנתקות",
    signIn: "התחברות",
    dashboard: "לוח בקרה",
    unreadNotifications: "{count} התראות שלא נקראו",
    commandPalette: "לוח פקודות Ctrl/Cmd + K",
    appRouter: "נתב אפליקציה",
    prismaReady: "Prisma מוכן",
    postgresReady: "PostgreSQL מוכן",
    expand: "הרחבה",
    collapse: "כיווץ",
    enterpriseArchitecture: "ארכיטקטורה ארגונית לניהול פעילות עיצוב.",
    sidebarFooter: "פיצול מודולרי מאפשר לקוד לצמוח בצורה נקייה עם גדילת הצוות.",
    loginTitle: "ברוך שובך",
    loginDesc: "התחבר לחשבון שלך כדי להמשיך.",
    emailAddress: "כתובת אימייל",
    password: "סיסמה",
    invalidCredentials: "אימייל או סיסמה שגויים. נסה שוב.",
    somethingWrong: "משהו השתבש. נסה שוב.",
    signingIn: "מתחבר...",
    dontHaveAccount: "אין לך חשבון?",
    createOne: "צור חשבון",
    registerTitle: "יצירת חשבון",
    registerDesc: "הצטרף ל-PlanDesign לניהול פרויקטים אדריכליים.",
    fullName: "שם מלא",
    confirmPassword: "אימות סיסמה",
    passwordsNoMatch: "הסיסמאות אינן תואמות.",
    creatingAccount: "יוצר חשבון...",
    createAccount: "יצירת חשבון",
    alreadyHaveAccount: "כבר יש לך חשבון?",
    yourName: "השם שלך",
    minEight: "לפחות 8 תווים",
    repeatPassword: "הקלד שוב את הסיסמה",
    hebrew: "עברית",
    english: "English"
  }
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function t(
  locale: AppLocale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let value: string = translations[locale][key] ?? translations.en[key];
  if (!vars) return value;
  for (const [name, data] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(data));
  }
  return value;
}
