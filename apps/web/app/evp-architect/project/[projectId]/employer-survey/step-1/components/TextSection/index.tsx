'use client';

import {useEffect, useState} from 'react';

import TextArea from '@kununu/ui/atoms/TextArea';

import styles from './index.module.scss';

interface TextSectionProps {
  readonly title: string;
  readonly maxLength?: number;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly value?: string;
}

export default function TextSection({
  maxLength = 1000,
  onChange,
  placeholder,
  title,
  value: externalValue = '',
}: TextSectionProps) {
  const [value, setValue] = useState(externalValue);

  // Sync internal state with external value
  useEffect(() => {
    setValue(externalValue);
  }, [externalValue]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={styles.textSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <TextArea
        id={`text-section-${title.toLowerCase().replaceAll(/\s+/g, '-')}`}
        maxLength={maxLength}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        value={value}
      />
    </div>
  );
}
