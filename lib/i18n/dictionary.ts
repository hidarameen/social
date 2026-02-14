import type { Locale } from '@/lib/i18n/types';

interface Messages {
  [key: string]: string | Messages;
}

export const messages: Record<Locale, Messages> = {
  en: {
    language: {
      label: 'Language',
      switchToArabic: 'Switch to Arabic',
      switchToEnglish: 'Switch to English',
      enShort: 'EN',
      arShort: 'AR',
    },
    breadcrumb: {
      workspace: 'Workspace',
    },
    header: {
      controlSuite: 'Control Suite',
      controlPanel: 'Control Panel',
      orchestration: 'Real-time orchestration',
      searchPlaceholder: 'Search tasks, accounts, logs...',
      quickSearch: 'Quick Search',
      notifications: 'Notifications',
      profile: 'Profile',
      logout: 'Logout',
      goToDashboard: 'Go to dashboard',
    },
    sidebar: {
      controlCenter: 'Control Center',
      orbitTitle: 'SocialFlow Orbit',
      orbitSubtitle: 'Next-gen multi-platform automation cockpit',
      liveStatus: 'Live Status',
      liveStatusDescription: 'Runtime healthy. Last sync cycle completed and all services online.',
      expandSidebar: 'Expand sidebar',
      collapseSidebar: 'Collapse sidebar',
    },
    auth: {
      identity: 'SocialFlow Identity',
      secureAccessTitle: 'Secure access to your automation workspace',
      secureAccessDescription:
        'Built for operators managing high-volume cross-platform workflows with enterprise-grade account protection.',
      verificationTitle: 'Verification First',
      verificationDescription: 'Email verification protects account ownership from day one.',
      sessionTitle: 'Fast Session Access',
      sessionDescription: 'Smart sign-in experience with callback routing and quick recovery flows.',
      uxTitle: 'Role-ready UX',
      uxDescription: 'Optimized for keyboard navigation, validation clarity, and accessibility.',
      dontHaveAccount: "Don't have an account?",
      createOne: 'Create one',
      creditLine: 'Programming & Design: Oday Algholy',
      rightsReserved: 'All rights reserved',
      themeLight: 'Light mode',
      themeDark: 'Dark mode',
    },
    dashboard: {
      welcomeTitle: 'Welcome to SocialFlow',
      launchNewAutomation: 'Launch New Automation',
      recentTasks: 'Recent Tasks',
      readyToAutomate: 'Ready to Automate?',
    },
  },
  ar: {
    language: {
      label: 'اللغة',
      switchToArabic: 'التبديل إلى العربية',
      switchToEnglish: 'التبديل إلى الإنجليزية',
      enShort: 'EN',
      arShort: 'AR',
    },
    breadcrumb: {
      workspace: 'مساحة العمل',
    },
    header: {
      controlSuite: 'مركز التحكم',
      controlPanel: 'لوحة التحكم',
      orchestration: 'تنسيق وتشغيل لحظي',
      searchPlaceholder: 'ابحث في المهام والحسابات والسجلات...',
      quickSearch: 'بحث سريع',
      notifications: 'الإشعارات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      goToDashboard: 'الانتقال للوحة التحكم',
    },
    sidebar: {
      controlCenter: 'مركز القيادة',
      orbitTitle: 'سوشال فلو أوربت',
      orbitSubtitle: 'منصة حديثة لأتمتة متعددة المنصات',
      liveStatus: 'الحالة المباشرة',
      liveStatusDescription: 'النظام يعمل بشكل ممتاز. آخر دورة مزامنة اكتملت وكل الخدمات متصلة.',
      expandSidebar: 'توسيع الشريط الجانبي',
      collapseSidebar: 'طي الشريط الجانبي',
    },
    auth: {
      identity: 'هوية SocialFlow',
      secureAccessTitle: 'وصول آمن إلى مساحة الأتمتة الخاصة بك',
      secureAccessDescription:
        'مصمم للمشغلين الذين يديرون تدفقات عمل عالية الحجم عبر المنصات مع حماية قوية للحسابات.',
      verificationTitle: 'التحقق أولاً',
      verificationDescription: 'التحقق عبر البريد يحمي ملكية الحساب منذ البداية.',
      sessionTitle: 'دخول سريع وآمن',
      sessionDescription: 'تجربة تسجيل دخول ذكية مع توجيه تلقائي واسترجاع سلس للحساب.',
      uxTitle: 'تجربة استخدام احترافية',
      uxDescription: 'محسّنة للتنقل بلوحة المفاتيح، ودقة التحقق، وسهولة الوصول.',
      dontHaveAccount: 'ليس لديك حساب؟',
      createOne: 'إنشاء حساب',
      creditLine: 'برمجة وتصميم: عدي الغولي',
      rightsReserved: 'جميع الحقوق محفوظة',
      themeLight: 'الوضع النهاري',
      themeDark: 'الوضع الليلي',
    },
    dashboard: {
      welcomeTitle: 'مرحباً بك في SocialFlow',
      launchNewAutomation: 'إطلاق أتمتة جديدة',
      recentTasks: 'المهام الأخيرة',
      readyToAutomate: 'جاهز للأتمتة؟',
    },
  },
};

export function getMessage(locale: Locale, key: string, fallback?: string): string {
  const value = key.split('.').reduce<Messages | string | undefined>((current, part) => {
    if (!current || typeof current === 'string') return undefined;
    return current[part];
  }, messages[locale]);

  return typeof value === 'string' ? value : fallback || key;
}
