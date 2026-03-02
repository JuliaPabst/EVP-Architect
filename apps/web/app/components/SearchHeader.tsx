'use client';

import React, {useState} from 'react';
import Button, {ButtonColor, ButtonType} from '@kununu/ui/atoms/Button';
import TextInput from '@kununu/ui/atoms/TextInput';
import Icon, {IconSize} from '@kununu/ui/atoms/Icon';
import Connect from '@kununu/ui/atoms/Icon/Icons/Connect';
import Message, {MessageType} from '@kununu/ui/atoms/Message';
import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import styles from './SearchHeader.module.css';

// Regex to validate kununu profile URLs
// Matches: https://www.kununu.com/{country_code}/{company_slug}
// Examples: https://www.kununu.com/at/oesterreichische-post
//           https://www.kununu.com/de/oesterreichische-post
//           https://www.kununu.com/ch/oesterreichische-post
const KUNUNU_PROFILE_URL_REGEX =
  /^https:\/\/www\.kununu\.com\/[a-z]{2}\/[\w-]+\/?$/i;

export default function SearchHeader() {
  const [companyUrl, setCompanyUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateKununuUrl = (url: string): boolean => {
    return KUNUNU_PROFILE_URL_REGEX.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the URL
    if (!validateKununuUrl(companyUrl)) {
      setErrorMessage(
        'Please enter a valid kununu profile URL (e.g., https://www.kununu.com/at/company-name)',
      );
      return;
    }

    // Clear any previous error
    setErrorMessage('');
    
    console.log('Loading EVP Project for:', companyUrl);
    // TODO: Implement EVP project loading logic
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyUrl(e.target.value);
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <section className={styles.searchHeaderWrapper}>
      <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      <div className={styles.searchHeader}>
        <div className={styles.content}>
          <div className={styles.wrapper}>
            <div className={styles.heading}>
              <h1 className={styles.mainHeading}>
                Do you want to find your Employer Value Proposition?
              </h1>
            </div>

            <div className={styles.subheadingWrapper}>
              <p className={styles.subheading}>
                Paste your company profile URL here:
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <div className={styles.inputWrapper}>
                <TextInput
                  id="company-url"
                  name="companyUrl"
                  placeholder="Company profile URL"
                  value={companyUrl}
                  onChange={handleUrlChange}
                  hasError={!!errorMessage}
                  leadingIcon={<Icon icon={Connect} size={IconSize.M} />}
                />
              </div>
              <Button
                color={ButtonColor.PRIMARY}
                type={ButtonType.SUBMIT}
                disabled={!companyUrl.trim()}
                text="Load EVP Project"
              />
            </form>

            {errorMessage && (
              <div className={styles.errorWrapper}>
                <Message type={MessageType.ERROR}>{errorMessage}</Message>
              </div>
            )}

            <div className={styles.linkWrapper}>
              <a href="#" className={styles.link}>
                Do you already have an EBP or a Claimed profile?
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
