'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
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
  const router = useRouter();
  const [companyUrl, setCompanyUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validateKununuUrl = (url: string): boolean => {
    return KUNUNU_PROFILE_URL_REGEX.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({companyUrl}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Redirect to the project page on success
      router.push(`/evp-architect/project/${data.projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setErrorMessage(
        'Sorry, this should not have happened. Please, try again later.',
      );
    } finally {
      setIsLoading(false);
    }
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
                disabled={!companyUrl.trim() || isLoading}
                isLoading={isLoading}
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
