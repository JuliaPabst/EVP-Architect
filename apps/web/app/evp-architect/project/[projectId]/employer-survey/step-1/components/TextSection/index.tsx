'use client';

import {useState} from 'react';

import TextArea from '@kununu/ui/atoms/TextArea';

import styles from './index.module.scss';

interface TextSectionProps {
  readonly maxLength?: number;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly title: string;
  readonly value?: string;
}

export default function TextSection({
  maxLength = 1000,
  onChange,
  placeholder,
  title,
  value: initialValue = '',
}: TextSectionProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={styles.textSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <TextArea
        id={`text-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        maxLength={maxLength}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        value={value}
      />
    </div>
  );
}
