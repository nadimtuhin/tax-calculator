import Vue from 'vue';
import VueI18n from 'vue-i18n';
import en from './locales/en.json';
import bn from './locales/bn.json';

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: 'en', // set default locale
  fallbackLocale: 'en',
  messages: {
    en,
    bn
  }
});

export const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'বাংলা' }
];
