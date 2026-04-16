'use client';

import {useState} from 'react';

import Button, {ButtonColor} from '@kununu/ui/atoms/Button';
import FormInputWrapper from '@kununu/ui/atoms/FormInputWrapper';
import Icon from '@kununu/ui/atoms/Icon';
import Sparks from '@kununu/ui/atoms/Icon/Icons/Sparks';
import Rocket from '@kununu/ui/atoms/Illustration/Illustrations/Spot/Rocket';
import TextInput from '@kununu/ui/atoms/TextInput';
import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';
import ClipboardCopy from '@kununu/ui/molecules/ClipboardCopy';
import Select from '@kununu/ui/molecules/Select';
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

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/evp-architect/project/${projectId}/employee-survey/step-1`;

  const canGenerate = Boolean(
    selectedTargetAudience &&
      selectedStyle &&
      selectedLanguage &&
      (!isExternalCommunication || targetAudienceDetail.trim()),
  );

  const handleGenerate = async () => {
    const settingsSaved = await saveSettings();

    if (!settingsSaved) return;

    await regenerate('', toSettings());
  };

  const handlePublish = async () => {
    if (!evpText) return;

    setIsPublishing(true);
    setPublishSuccess(false);

    try {
      const response = await fetch(
        `/api/evp-pipeline/publish?projectId=${projectId}&adminToken=${adminToken}`,
        {
          body: JSON.stringify({evpText}),
          headers: {'Content-Type': 'application/json'},
          method: 'POST',
        },
      );

      if (response.ok) {
        setPublishSuccess(true);
      }
    } catch {
      // publish error is silent — user sees no success message
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!evpText) return;

    const blob = new Blob([evpText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.download = 'evp.txt';
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.main}>
      <div className={styles.heroBackground}>
        <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      </div>
      <div className={styles.container}>
        <div className={styles.cardHeader}>
          <Rocket className={styles.rocketIcon} />
          <h1 className={styles.heroTitle}>Employer Value Preposition</h1>
          <p className={styles.heroSubtitle}>
            You&apos;re all set! Your Employer Value Preposition is ready to be
            generated. Thanks to the voices collected from your employees, we
            can now showcase what makes your company stand out from the rest.
          </p>
        </div>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <p className={styles.cardHeadingText}>
              Collecting multiple perspectives is key to a strong EVP
            </p>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.bodyText}>
              The more employee voices you include, the more authentic and
              representative your results will be. We recommend gathering
              feedback from at least 5 employees to ensure meaningful insights
              while maintaining anonymity.
            </p>
            <FormInputWrapper label="Link" labelId="evp-share-link-label">
              <ClipboardCopy content={shareUrl} name="evp-share-link" />
            </FormInputWrapper>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <p className={styles.cardHeadingText}>Your Value proposition</p>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.bodyText}>
              Our AI will create a tailored draft based on your inputs. You can
              adjust your settings at any time and regenerate the EVP until it
              reflects your company exactly the way you want.
            </p>

            <div className={styles.formFields}>
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

              {isExternalCommunication && (
                <TextInput
                  id="evp-gen-target-audience-detail"
                  labelId="evp-gen-target-audience-detail-label"
                  name="target_audience_detail"
                  onChange={e => setTargetAudienceDetail(e.target.value)}
                  placeholder={targetAudienceDetailPrompt}
                  value={targetAudienceDetail}
                />
              )}

              <div className={styles.twoColumns}>
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

              {settingsError && (
                <p className={styles.errorMessage}>{settingsError}</p>
              )}

              <Button
                color={ButtonColor.AI}
                disabled={!canGenerate || isRegenerating}
                isLoading={isRegenerating}
                leadingIcon={<Icon icon={Sparks} />}
                loadingText="Generating…"
                onClick={handleGenerate}
                text="Generate your EVP"
              />
            </div>

            {(isLoading || error || evpText) && (
              <div className={styles.previewSection}>
                <p className={styles.previewLabel}>Preview</p>

                {isLoading && (
                  <p className={styles.loadingMessage}>Generating EVP…</p>
                )}

                {error && <p className={styles.errorMessage}>{error}</p>}

                {evpText && (
                  <>
                    <div className={styles.evpContent}>
                      <p className={styles.bodyText}>{evpText}</p>
                    </div>
                    <div className={styles.actionButtons}>
                      <Button
                        color={ButtonColor.Secondary}
                        disabled={isPublishing}
                        isLoading={isPublishing}
                        loadingText="Publishing…"
                        onClick={handlePublish}
                        text="Publish on your company profile"
                      />
                      <Button
                        color={ButtonColor.Primary}
                        onClick={handleDownloadPdf}
                        text="Download Pdf"
                      />
                    </div>
                    {publishSuccess && (
                      <p className={styles.successMessage}>
                        Successfully published to your company profile.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
