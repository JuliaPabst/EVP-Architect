'use client';

import React, {useState} from 'react';

import {useRouter} from 'next/navigation';

import Button, {ButtonColor, ButtonType} from '@kununu/ui/atoms/Button';
import Icon, {IconSize} from '@kununu/ui/atoms/Icon';
import Connect from '@kununu/ui/atoms/Icon/Icons/Connect';
import Message, {MessageType} from '@kununu/ui/atoms/Message';
import TextInput from '@kununu/ui/atoms/TextInput';
import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import {isValidKununuUrl} from '../../../lib/kununuUrlValidation';

import styles from './index.module.scss';

export default function SearchHeader() {
  const router = useRouter();
  const [companyUrl, setCompanyUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the URL
    if (!isValidKununuUrl(companyUrl)) {
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
        body: JSON.stringify({companyUrl}),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Redirect to the project page on success
      router.push(`/evp-architect/project/${data.projectId}`);
    } catch (error) {
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
    <section className={styles.searchHeaderWrapper} data-testid="search-header">
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

            <form className={styles.inputForm} onSubmit={handleSubmit}>
              <div className={styles.inputWrapper}>
                <TextInput
                  hasError={!!errorMessage}
                  id="company-url"
                  leadingIcon={<Icon icon={Connect} size={IconSize.M} />}
                  name="companyUrl"
                  onChange={handleUrlChange}
                  placeholder="Company profile URL"
                  value={companyUrl}
                />
              </div>
              <Button
                color={ButtonColor.PRIMARY}
                disabled={!companyUrl.trim() || isLoading}
                isLoading={isLoading}
                text="Load EVP Project"
                type={ButtonType.SUBMIT}
              />
            </form>

            {errorMessage && (
              <div className={styles.errorWrapper}>
                <Message type={MessageType.ERROR}>{errorMessage}</Message>
              </div>
            )}

            <div className={styles.linkWrapper}>
              <button className={styles.link} type="button">
                Do you already have an EBP or a Claimed profile?
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
