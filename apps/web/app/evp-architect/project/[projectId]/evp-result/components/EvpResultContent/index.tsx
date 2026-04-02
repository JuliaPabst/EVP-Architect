'use client';

import {useState} from 'react';

import FormInputWrapper from '@kununu/ui/atoms/FormInputWrapper';
import TextInput from '@kununu/ui/atoms/TextInput';
import Select from '@kununu/ui/molecules/Select';
import {ResultItem} from '@kununu/ui/shared/typings/resultItem';

import styles from './index.module.scss';

import useEvpResult from '@/app/hooks/useEvpResult';
import useEvpSettings from '@/app/hooks/useEvpSettings';

interface EvpResultContentProps {
  readonly adminToken: string;
  readonly projectId: string;
}

export default function EvpResultContent({
  adminToken,
  projectId,
}: EvpResultContentProps) {
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
  } = useEvpSettings(projectId, adminToken);

  const {error, evpText, isLoading, isRegenerating, regenerate} = useEvpResult(
    projectId,
    adminToken,
    outputType,
  );

  const [commentText, setCommentText] = useState('');

  async function handleRegenerate() {
    // Save settings first
    const settingsSaved = await saveSettings();

    if (!settingsSaved) return;

    // Then regenerate with the settings
    const settings = {
      language: selectedLanguage,
      targetAudience: selectedTargetAudience,
      targetAudienceDetail: isExternalCommunication ? targetAudienceDetail : '',
      toneOfVoice: selectedStyle,
    };

    await regenerate(commentText, settings);
    setCommentText('');
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.section}>
          <h1 className={styles.heading}>Your EVP</h1>

          {isLoading && (
            <p className={styles.loadingMessage}>Generating EVP…</p>
          )}

          {error && <p className={styles.errorMessage}>{error}</p>}

          {evpText && <div className={styles.evpContent}>{evpText}</div>}
        </section>

        {evpText && (
          <section className={styles.section}>
            <h2 className={styles.subHeading}>Adjust EVP</h2>

            <div className={styles.settingsForm}>
              {/* Target Audience */}
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label="Target Audience"
                  labelId="evp-result-target-audience-label"
                >
                  <Select
                    id="evp-result-target-audience"
                    items={targetAudienceOptions}
                    labelId="evp-result-target-audience-label"
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

              {/* Conditional Target Audience Detail */}
              {isExternalCommunication && (
                <div className={styles.fieldWrapper}>
                  <FormInputWrapper
                    label={targetAudienceDetailPrompt}
                    labelId="evp-result-target-audience-detail-label"
                  >
                    <TextInput
                      id="evp-result-target-audience-detail"
                      labelId="evp-result-target-audience-detail-label"
                      name="target_audience_detail"
                      onChange={e => setTargetAudienceDetail(e.target.value)}
                      placeholder="Who do you want to address?"
                      value={targetAudienceDetail}
                    />
                  </FormInputWrapper>
                </div>
              )}

              {/* Tone of Voice */}
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label="Tone of Voice"
                  labelId="evp-result-style-label"
                >
                  <Select
                    id="evp-result-style"
                    items={styleOptions}
                    labelId="evp-result-style-label"
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

              {/* Language */}
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label="Language"
                  labelId="evp-result-language-label"
                >
                  <Select
                    id="evp-result-language"
                    items={languageOptions}
                    labelId="evp-result-language-label"
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
            </div>

            {settingsError && (
              <div className={styles.errorMessage}>{settingsError}</div>
            )}

            <textarea
              className={styles.textarea}
              disabled={isRegenerating}
              onChange={e => setCommentText(e.currentTarget.value)}
              placeholder="Describe what you'd like to change…"
              value={commentText}
            />

            <button
              className={styles.button}
              disabled={isRegenerating || !commentText.trim()}
              onClick={handleRegenerate}
              type="button"
            >
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
