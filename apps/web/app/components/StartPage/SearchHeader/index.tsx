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

import styles from './index.module.scss';

import {isValidKununuUrl} from '@/lib/scraping';

export default function SearchHeader() {
  const router = useRouter();
  const [companyUrl, setCompanyUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim the URL
    const trimmedUrl = companyUrl.trim();

    // Check for spaces within the URL
    if (trimmedUrl.includes(' ')) {
      setErrorMessage('Die URL darf keine Leerzeichen enthalten');
      return;
    }

    // Validate the URL
    if (!isValidKununuUrl(trimmedUrl)) {
      setErrorMessage(
        'Bitte gib eine gültige kununu-Profil-URL ein (z. B. https://www.kununu.com/at/unternehmensname)',
      );
      return;
    }

    // Clear any previous error
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/projects/create', {
        body: JSON.stringify({companyUrl: trimmedUrl}),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      // Redirect to employer survey step-1 with admin token in hash (never sent to server)
      router.push(
        `/evp-architect/project/${data.projectId}/employer-survey/step-1#admin=${data.adminToken}`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create project:', error);
      setErrorMessage(
        'Das sollte nicht passiert sein. Bitte versuche es später erneut.',
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
                Finden Sie Ihre Employer Value Proposition!
              </h1>
            </div>

            <div className={styles.subheadingWrapper}>
              <p className={styles.subheading}>
                Fügen Sie hier den Link Ihres kununu Unternehmensprofils ein:
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
                  placeholder="Link zum kununu Unternehmensprofil"
                  value={companyUrl}
                />
              </div>
              <Button
                color={ButtonColor.PRIMARY}
                disabled={!companyUrl.trim() || isLoading}
                isLoading={isLoading}
                text="EVP-Projekt laden"
                type={ButtonType.SUBMIT}
              />
            </form>

            {errorMessage && (
              <div className={styles.errorWrapper}>
                <Message type={MessageType.ERROR}>{errorMessage}</Message>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
