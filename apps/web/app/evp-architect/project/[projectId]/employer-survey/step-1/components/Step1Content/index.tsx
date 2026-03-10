'use client';

import {useState} from 'react';

import {useRouter} from 'next/navigation';

import FocusSelection from '../FocusSelection';
import NavigationButtons from '../NavigationButtons';
import ProgressHeader from '../ProgressHeader';
import SelectedCompany from '../SelectedCompany';
import TextSection from '../TextSection';
import styles from './index.module.scss';

interface Step1ContentProps {
  readonly companyName: string;
  readonly projectId: string;
  readonly industry?: string;
  readonly location?: string;
  readonly logoUrl?: string;
}

// Values from Figma design - Culture & Values
const focusOptions = [
  {id: 'customer-centricity', label: 'Customer Centricity'},
  {id: 'efficiency', label: 'Efficiency'},
  {id: 'social-responsibility', label: 'Social Responsibility'},
  {id: 'trust', label: 'Trust'},
  {id: 'respect', label: 'Respect'},
  {id: 'teamwork', label: 'Teamwork'},
  {id: 'openness', label: 'Openness'},
  {id: 'flexibility', label: 'Flexibility'},
  {id: 'agility', label: 'Agility'},
  {id: 'integrity', label: 'Integrity'},
  {id: 'sustainability', label: 'Sustainability'},
  {id: 'perfection', label: 'Perfection'},
  {id: 'ethics', label: 'Ethics'},
  {id: 'creativity', label: 'Creativity'},
  {id: 'motivation', label: 'Motivation'},
  {id: 'willingness-to-learn', label: 'Willingness to Learn'},
  {id: 'communication', label: 'Communication'},
  {id: 'reliability', label: 'Reliability'},
  {id: 'equality', label: 'Equality'},
  {id: 'goal-orientation', label: 'Goal Orientation'},
  {id: 'transparency', label: 'Transparency'},
];

export default function Step1Content({
  companyName,
  projectId,
  industry,
  location,
  logoUrl,
}: Step1ContentProps) {
  const router = useRouter();
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');

  const canContinue = selectedFactors.length >= 1 && selectedFactors.length <= 5;

  const handleBack = () => {
    router.push(`/evp-architect/project/${projectId}`);
  };

  const handleContinue = () => {
    // TODO: Save data and navigate to step 2
    router.push(
      `/evp-architect/project/${projectId}/employer-survey/step-2`,
    );
  };

  return (
    <div className={styles.step1Content}>
      <div className={styles.container}>
        <ProgressHeader
          currentStep={1}
          onBack={handleBack}
          title="Who you are today (Culture & Values)?"
          totalSteps={5}
        />

        <SelectedCompany
          companyName={companyName}
          industry={industry}
          location={location}
          logoUrl={logoUrl}
        />

        <FocusSelection
          maxSelections={5}
          minSelections={1}
          onChange={setSelectedFactors}
          options={focusOptions}
          title="Which of these values most strongly shape everyday behavior and decisions in your company?"
        />

        <TextSection
          onChange={setAdditionalContext}
          placeholder=""
          title="What do employees consistently value most about working here?"
          value={additionalContext}
        />

        <NavigationButtons
          canContinue={canContinue}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}
