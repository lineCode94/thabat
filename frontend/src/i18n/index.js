import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import arAchievements from '@/locales/ar/achievements.json';
import arAdmin from '@/locales/ar/admin.json';
import arAuth from '@/locales/ar/auth.json';
import arBadges from '@/locales/ar/badges.json';
import arCommon from '@/locales/ar/common.json';
import arDashboard from '@/locales/ar/dashboard.json';
import arLayout from '@/locales/ar/layout.json';
import arMentor from '@/locales/ar/mentor.json';
import arMissions from '@/locales/ar/missions.json';
import arNotifications from '@/locales/ar/notifications.json';
import arProfile from '@/locales/ar/profile.json';
import arPromotion from '@/locales/ar/promotion.json';
import arReports from '@/locales/ar/reports.json';
import arReviews from '@/locales/ar/reviews.json';
import arSettings from '@/locales/ar/settings.json';
import arTools from '@/locales/ar/tools.json';
import arTracking from '@/locales/ar/tracking.json';
import arValidation from '@/locales/ar/validation.json';
import enAchievements from '@/locales/en/achievements.json';
import enAdmin from '@/locales/en/admin.json';
import enAuth from '@/locales/en/auth.json';
import enBadges from '@/locales/en/badges.json';
import enCommon from '@/locales/en/common.json';
import enDashboard from '@/locales/en/dashboard.json';
import enLayout from '@/locales/en/layout.json';
import enMentor from '@/locales/en/mentor.json';
import enMissions from '@/locales/en/missions.json';
import enNotifications from '@/locales/en/notifications.json';
import enProfile from '@/locales/en/profile.json';
import enPromotion from '@/locales/en/promotion.json';
import enReports from '@/locales/en/reports.json';
import enReviews from '@/locales/en/reviews.json';
import enSettings from '@/locales/en/settings.json';
import enTools from '@/locales/en/tools.json';
import enTracking from '@/locales/en/tracking.json';
import enValidation from '@/locales/en/validation.json';

export const LANGUAGE_STORAGE_KEY = 'thabat-language';

export const supportedLanguages = {
  en: { direction: 'ltr', fontClass: 'font-english' },
  ar: { direction: 'rtl', fontClass: 'font-arabic' },
};

const resources = {
  en: {
    achievements: enAchievements,
    admin: enAdmin,
    auth: enAuth,
    badges: enBadges,
    common: enCommon,
    dashboard: enDashboard,
    layout: enLayout,
    mentor: enMentor,
    missions: enMissions,
    notifications: enNotifications,
    profile: enProfile,
    promotion: enPromotion,
    reports: enReports,
    reviews: enReviews,
    settings: enSettings,
    tracking: enTracking,
    tools: enTools,
    validation: enValidation,
  },
  ar: {
    achievements: arAchievements,
    admin: arAdmin,
    auth: arAuth,
    badges: arBadges,
    common: arCommon,
    dashboard: arDashboard,
    layout: arLayout,
    mentor: arMentor,
    missions: arMissions,
    notifications: arNotifications,
    profile: arProfile,
    promotion: arPromotion,
    reports: arReports,
    reviews: arReviews,
    settings: arSettings,
    tracking: arTracking,
    tools: arTools,
    validation: arValidation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: Object.keys(supportedLanguages),
    ns: Object.keys(resources.en),
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export function applyLanguageAttributes(language) {
  const normalizedLanguage = supportedLanguages[language] ? language : 'en';
  const { direction, fontClass } = supportedLanguages[normalizedLanguage];
  const root = document.documentElement;

  root.lang = normalizedLanguage;
  root.dir = direction;
  root.classList.remove('font-english', 'font-arabic');
  root.classList.add(fontClass);
}

export default i18n;
