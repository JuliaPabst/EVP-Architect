'use client';

import React, {useState} from 'react';
import Button, {ButtonColor, ButtonType} from '@kununu/ui/atoms/Button';
import TextInput from '@kununu/ui/atoms/TextInput';
import Icon, {IconSize} from '@kununu/ui/atoms/Icon';
import Connect from '@kununu/ui/atoms/Icon/Icons/Connect';
import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import styles from './SearchHeader.module.css';

export default function SearchHeader() {
  const [companyUrl, setCompanyUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Loading EVP Project for:', companyUrl);
    // TODO: Implement EVP project loading logic
  };

  return (
    <section className={styles.searchHeaderWrapper}>
      <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      <div className={styles.searchHeader}>
        <div className={styles.content}>
          <div className={styles.wrapper}>
            <div className={styles.heading}>
              <h1 className={styles.mainHeading}>
                Do you want to find your Employer Value preposition?
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
                  onChange={(e) => setCompanyUrl(e.target.value)}
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
