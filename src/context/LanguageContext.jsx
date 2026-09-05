import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  EN: {
    // Sidebar nav
    dashboard: 'Dashboard',
    transactions: 'Income & Expense',
    savings: 'How to Save',
    taxReports: 'Tax Write-Offs',
    analytics: 'Analytics',
    settings: 'Settings',
    signOut: 'Sign Out',
    adminConsole: 'Open Admin Console',
    personalWealthManager: 'Personal Wealth Manager',
    netCashFlow: 'Net Cash Flow',
    activeMember: 'Active Member',
    upgradeToPro: 'UPGRADE TO PRO',
    unlimitedScans: 'Unlimited Scans & Tax Suite',
    getPro: 'Get PRO ($2/mo)',
    advisorPlan: 'ADVISOR PLAN',
    proSuiteActive: 'PRO SUITE ACTIVE',

    // Settings page
    settingsTitle: 'Settings',
    settingsDesc: 'Manage your account, preferences, and financial data.',
    preferences: 'Preferences',
    defaultCurrency: 'Default Currency',
    appearance: 'Appearance & Language',
    darkMode: 'Dark Mode',
    language: 'Language',
    darkModeDesc: 'Switch between light and dark interface.',
    languageDesc: 'Choose display language.',
    userAccount: 'User Account & Profile',
    updatePassword: 'Update Password',
    updatePasswordDesc: 'Change your personal authentication password to keep your financial ledger secure.',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    saveNewPassword: 'Save New Password',
    updating: 'Updating...',
    superAdmin: 'Super Administrator',
    clientAccount: 'Client Account',
    dangerZone: 'Danger Zone',
    dangerZoneDesc: 'Permanently purge individual tables or wipe your entire financial history.',
    clearExpenses: 'Clear All Expenses',
    clearIncomes: 'Clear All Incomes',
    clearGoals: 'Clear All Savings Goals',
    factoryReset: 'Factory Reset (Wipe All)',
    oldPasswordPlaceholder: 'Old password',
    newPasswordPlaceholder: 'New password (4+ chars)',
    confirmPasswordPlaceholder: 'Re-type new password',
    passwordUpdated: 'Password updated successfully!',
    passwordMismatch: 'New passwords do not match. Please re-type to confirm.',
    passwordTooShort: 'New password must be at least 4 characters long.',
    passwordRequired: 'Please enter both current and new password.',

    // Auth page
    signIn: 'Sign In',
    createAccount: 'Create Account',
    getStarted: 'Get Started Free',
    emailOrName: 'Email or Username',
    password: 'Password',
    fullName: 'Full Name',
    email: 'Email Address',
    loginBtn: 'Sign In',
    registerBtn: 'Create Account',
  },

  KH: {
    // Sidebar nav
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    transactions: 'ចំណូល & ចំណាយ',
    savings: 'របៀបសន្សំ',
    taxReports: 'ការបញ្ចុះពន្ធ',
    analytics: 'ការវិភាគ',
    settings: 'ការកំណត់',
    signOut: 'ចេញពីគណនី',
    adminConsole: 'បើកកុងសូលអ្នកគ្រប់គ្រង',
    personalWealthManager: 'កម្មវិធីគ្រប់គ្រងទ្រព្យ',
    netCashFlow: 'លំហូរសាច់ប្រាក់សុទ្ធ',
    activeMember: 'សមាជិកសកម្ម',
    upgradeToPro: 'ធ្វើឱ្យប្រសើរជា PRO',
    unlimitedScans: 'ស្កែនគ្មានដែនកំណត់',
    getPro: 'ទទួល PRO ($2/ខែ)',
    advisorPlan: 'គម្រោងអ្នកប្រឹក្សា',
    proSuiteActive: 'PRO សកម្ម',

    // Settings page
    settingsTitle: 'ការកំណត់',
    settingsDesc: 'គ្រប់គ្រងគណនី, ចំណូលចិត្ត, និងទិន្នន័យហិរញ្ញវត្ថុ។',
    preferences: 'ចំណូលចិត្ត',
    defaultCurrency: 'រូបិយប័ណ្ណលំនាំដើម',
    appearance: 'រូបរាង & ភាសា',
    darkMode: 'របៀបងងឹត',
    language: 'ភាសា',
    darkModeDesc: 'ប្តូររវាងរចនាប័ទ្មភ្លឺ និងងងឹត។',
    languageDesc: 'ជ្រើសរើសភាសាដែលបង្ហាញ។',
    userAccount: 'គណនី & ប្រវត្តិរូប',
    updatePassword: 'ផ្លាស់ប្តូរពាក្យសម្ងាត់',
    updatePasswordDesc: 'ផ្លាស់ប្តូរពាក្យសម្ងាត់ផ្ទាល់ខ្លួនដើម្បីរក្សាការចូលប្រើប្រាស់របស់អ្នក។',
    currentPassword: 'ពាក្យសម្ងាត់បច្ចុប្បន្ន',
    newPassword: 'ពាក្យសម្ងាត់ថ្មី',
    confirmNewPassword: 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី',
    saveNewPassword: 'រក្សាទុកពាក្យសម្ងាត់ថ្មី',
    updating: 'កំពុងអាប់ដេត...',
    superAdmin: 'អ្នកគ្រប់គ្រងកំពូល',
    clientAccount: 'គណនីអតិថិជន',
    dangerZone: 'តំបន់គ្រោះថ្នាក់',
    dangerZoneDesc: 'លុបទិន្នន័យហិរញ្ញវត្ថុជាអចិន្ត្រៃយ៍។',
    clearExpenses: 'លុបចំណាយទាំងអស់',
    clearIncomes: 'លុបចំណូលទាំងអស់',
    clearGoals: 'លុបគោលដៅសន្សំទាំងអស់',
    factoryReset: 'កំណត់ឡើងវិញទាំងស្រុង',
    oldPasswordPlaceholder: 'ពាក្យសម្ងាត់ចាស់',
    newPasswordPlaceholder: 'ពាក្យសម្ងាត់ថ្មី (4+ តួ)',
    confirmPasswordPlaceholder: 'វាយម្តងទៀត',
    passwordUpdated: 'ផ្លាស់ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!',
    passwordMismatch: 'ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នា។ សូមវាយម្តងទៀត។',
    passwordTooShort: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 4 តួ។',
    passwordRequired: 'សូមបញ្ចូលពាក្យសម្ងាត់ចាស់ និងថ្មី។',

    // Auth page
    signIn: 'ចូលប្រើ',
    createAccount: 'បង្កើតគណនី',
    getStarted: 'ចាប់ផ្តើមដោយឥតគិតថ្លៃ',
    emailOrName: 'អ៊ីម៉ែល ឬ ឈ្មោះ',
    password: 'ពាក្យសម្ងាត់',
    fullName: 'ឈ្មោះពេញ',
    email: 'អ៊ីម៉ែល',
    loginBtn: 'ចូលប្រើ',
    registerBtn: 'បង្កើតគណនី',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('sf_lang') || 'EN';
  });

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'EN' ? 'KH' : 'EN';
      localStorage.setItem('sf_lang', next);
      return next;
    });
  };

  const t = (key) => translations[lang]?.[key] || translations['EN'][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isKH: lang === 'KH' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
