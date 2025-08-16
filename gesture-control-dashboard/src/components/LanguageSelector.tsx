import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { authRepository } from '../repositories/authRepository';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  const changeLanguage = async (lng: string) => {
    // Change language in i18n
    i18n.changeLanguage(lng);
    
    // If user is authenticated, sync with API
    if (isAuthenticated) {
      try {
        await authRepository.updateLanguage(lng);
        console.log('Language preference updated on server');
      } catch (error) {
        console.error('Failed to update language on server:', error);
      }
    }
  };

  const getCurrentLanguageFlag = () => {
    return i18n.language === 'es' ? '🇪🇸' : '🇺🇸';
  };

  const getCurrentLanguageName = () => {
    return i18n.language === 'es' ? 'Español' : 'English';
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-light" id="language-dropdown" size="sm">
        {getCurrentLanguageFlag()} {getCurrentLanguageName()}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item 
          active={i18n.language === 'en'}
          onClick={() => changeLanguage('en')}
        >
          🇺🇸 English
        </Dropdown.Item>
        <Dropdown.Item 
          active={i18n.language === 'es'}
          onClick={() => changeLanguage('es')}
        >
          🇪🇸 Español
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};