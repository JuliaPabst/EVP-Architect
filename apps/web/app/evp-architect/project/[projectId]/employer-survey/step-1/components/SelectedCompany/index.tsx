'use client';

import Location from '@kununu/ui/particles/Icons/System/Location';
import OfficeBlock from '@kununu/ui/particles/Icons/System/OfficeBlock';

import styles from './index.module.scss';

interface SelectedCompanyProps {
  readonly companyName: string;
  readonly industry?: string;
  readonly location?: string;
  readonly logoUrl?: string;
}

export default function SelectedCompany({
  companyName,
  industry,
  location,
  logoUrl,
}: SelectedCompanyProps) {
  return (
    <div className={styles.selectedCompany}>
      <div className={styles.companyInfo}>
        <h2 className={styles.companyName}>{companyName}</h2>
        {location && (
          <div className={styles.infoRow}>
            <Location />
            <span className={styles.infoText}>{location}</span>
          </div>
        )}
        {industry && (
          <div className={styles.infoRow}>
            <OfficeBlock />
            <span className={styles.infoText}>{industry}</span>
          </div>
        )}
      </div>
      {logoUrl && (
        <div className={styles.logoContainer}>
          <div className={styles.logoSurface}>
            <img
              alt={`${companyName} logo`}
              className={styles.logo}
              src={logoUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
}
