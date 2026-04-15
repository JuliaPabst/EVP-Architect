'use client';

import {useState} from 'react';

import Button, {ButtonColor} from '@kununu/ui/atoms/Button';
import FormInputWrapper from '@kununu/ui/atoms/FormInputWrapper';
import TextArea from '@kununu/ui/atoms/TextArea';
import TextInput from '@kununu/ui/atoms/TextInput';
import Select from '@kununu/ui/molecules/Select';
import Divider from '@kununu/ui/particles/Divider';
import {ResultItem} from '@kununu/ui/shared/typings/resultItem';

import styles from './index.module.scss';

import useEvpResult from '@/app/hooks/useEvpResult';
import useEvpSettings from '@/app/hooks/useEvpSettings';

interface EvpGenerationContentProps {
  readonly adminToken: string;
  readonly projectId: string;
}

export default function EvpGenerationContent({
  adminToken,
  projectId,
}: EvpGenerationContentProps) {
  const {
    isExternalCommunication,
    languageOptions,
    outputType,
    saveSettings,
    selectedLanguage,
    selectedStyle,
    selectedTargetAudience,
    setSelectedLanguage,
    setSelectedStyle,
    setSelectedTargetAudience,
    setTargetAudienceDetail,
    settingsError,
    styleOptions,
    targetAudienceDetail,
    targetAudienceDetailPrompt,
    targetAudienceOptions,
    toSettings,
  } = useEvpSettings(projectId, adminToken);

  const {error, evpText, isLoading, isRegenerating, regenerate} = useEvpResult(
    projectId,
    adminToken,
    outputType,
  );

  const [commentText, setCommentText] = useState('');

  const canGenerate = Boolean(
    selectedTargetAudience &&
      selectedStyle &&
      selectedLanguage &&
      (!isExternalCommunication || targetAudienceDetail.trim()),
  );

  const handleGenerate = async () => {
    const settingsSaved = await saveSettings();

    if (!settingsSaved) return;

    await regenerate(commentText, toSettings());
    setCommentText('');
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.configSection}>
          <h1 className="h3-semibold">Generate your EVP</h1>

          <div className={styles.formFields}>
            <div className={styles.fieldWrapper}>
              <FormInputWrapper
                label="Target Audience"
                labelId="evp-gen-target-audience-label"
              >
                <Select
                  id="evp-gen-target-audience"
                  items={targetAudienceOptions}
                  labelId="evp-gen-target-audience-label"
                  name="target_audience"
                  onChange={(selected: ResultItem | null) => {
                    if (selected) {
                      setSelectedTargetAudience(String(selected.value));
                    }
                  }}
                  placeholder="Wählen Sie eine Option"
                  value={selectedTargetAudience}
                />
              </FormInputWrapper>
            </div>

            {isExternalCommunication && (
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label={targetAudienceDetailPrompt}
                  labelId="evp-gen-target-audience-detail-label"
                >
                  <TextInput
                    id="evp-gen-target-audience-detail"
                    labelId="evp-gen-target-audience-detail-label"
                    name="target_audience_detail"
                    onChange={e => setTargetAudienceDetail(e.target.value)}
                    placeholder="Who do you want to address?"
                    value={targetAudienceDetail}
                  />
                </FormInputWrapper>
              </div>
            )}

            <div className={styles.fieldWrapper}>
              <FormInputWrapper label="Style" labelId="evp-gen-style-label">
                <Select
                  id="evp-gen-style"
                  items={styleOptions}
                  labelId="evp-gen-style-label"
                  name="tone_of_voice"
                  onChange={(selected: ResultItem | null) => {
                    if (selected) {
                      setSelectedStyle(String(selected.value));
                    }
                  }}
                  placeholder="Wählen Sie eine Option"
                  value={selectedStyle}
                />
              </FormInputWrapper>
            </div>

            <div className={styles.fieldWrapper}>
              <FormInputWrapper
                label="Language"
                labelId="evp-gen-language-label"
              >
                <Select
                  id="evp-gen-language"
                  items={languageOptions}
                  labelId="evp-gen-language-label"
                  name="language"
                  onChange={(selected: ResultItem | null) => {
                    if (selected) {
                      setSelectedLanguage(String(selected.value));
                    }
                  }}
                  placeholder="Wählen Sie eine Option"
                  value={selectedLanguage}
                />
              </FormInputWrapper>
            </div>

            <div className={styles.fieldWrapper}>
              <FormInputWrapper
                label="What would you like to change/add?"
                labelId="evp-gen-comment-label"
              >
                <TextArea
                  disabled={isRegenerating}
                  id="evp-gen-comment"
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Describe what you'd like to change…"
                  value={commentText}
                />
              </FormInputWrapper>
            </div>
          </div>

          {settingsError && (
            <p className={styles.errorMessage}>{settingsError}</p>
          )}

          <div className={styles.generateButton}>
            <Button
              color={ButtonColor.AI}
              disabled={!canGenerate || isRegenerating}
              isLoading={isRegenerating}
              loadingText="Generating…"
              onClick={handleGenerate}
              text="Generate your EVP"
            />
          </div>
        </section>

        {(isLoading || error || evpText) && (
          <section className={styles.outputSection}>
            <Divider />

            {isLoading && (
              <p className={styles.loadingMessage}>Generating EVP…</p>
            )}

            {error && <p className={styles.errorMessage}>{error}</p>}

            {evpText && (
              <div className={styles.evpContent}>
                <p className="p-base-regular">{evpText}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
