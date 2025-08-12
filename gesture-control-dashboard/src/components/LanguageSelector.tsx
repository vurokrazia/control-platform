import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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