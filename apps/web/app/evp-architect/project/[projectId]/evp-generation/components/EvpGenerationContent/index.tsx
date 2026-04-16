'use client';

import Button, {ButtonColor} from '@kununu/ui/atoms/Button';
import FormInputWrapper from '@kununu/ui/atoms/FormInputWrapper';
import Icon from '@kununu/ui/atoms/Icon';
import Download from '@kununu/ui/atoms/Icon/Icons/Download';
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

function formatEvpText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /^(#{1,6}) (.+)$/gm,
      (_, hashes: string, content: string) =>
        `<h${hashes.length}>${content}</h${hashes.length}>`,
    );
}

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

  const handleDownloadPdf = () => {
    if (!evpText) return;

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>EVP</title>
    <style>
      @page { margin: 0; }
      body { font-family: Inter, sans-serif; padding: 40px; white-space: pre-wrap; }
      h1 { font-family: 'Sharp Grotesk Semibold', sans-serif; font-size: 28px; font-weight: 600; letter-spacing: 0.3px; line-height: 36px; }
      h2 { font-family: 'Sharp Grotesk Semibold', sans-serif; font-size: 20px; font-weight: 600; letter-spacing: 0.2px; line-height: 28px; }
      h3 { font-family: 'Sharp Grotesk Medium', sans-serif; font-size: 18px; font-weight: 600; letter-spacing: 0.2px; line-height: 26px; }
      h4, h5, h6 { font-family: Inter, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; line-height: 24px; }
    </style>
  </head>
  <body>${formatEvpText(evpText)}</body>
</html>`;

    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');

    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.print();
      URL.revokeObjectURL(url);

      iframe.contentWindow?.addEventListener('afterprint', () => {
        document.body.removeChild(iframe);
      });
    };
  };

  return (
    <main className={styles.main}>
      <div className={styles.heroBackground}>
        <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      </div>
      <div className={styles.container}>
        <div className={styles.cardHeader}>
          <Rocket className={styles.rocketIcon} />
          <h1 className={styles.heroTitle}>Employer Value Proposition</h1>
          <p className={styles.heroSubtitle}>
            Alles bereit! Deine Employer Value Proposition kann jetzt generiert
            werden. Dank der Stimmen deiner Mitarbeiter:innen können wir zeigen,
            was dein Unternehmen einzigartig macht.
          </p>
        </div>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <p className={styles.cardHeadingText}>
              Mehrere Perspektiven sind der Schlüssel zu einer starken EVP
            </p>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.bodyText}>
              Je mehr Mitarbeiter:innen du einbeziehst, desto authentischer und
              repräsentativer werden deine Ergebnisse. Wir empfehlen Feedback
              von mindestens 5 Personen, um aussagekräftige Einblicke bei
              gleichzeitiger Wahrung der Anonymität zu erhalten.
            </p>
            <FormInputWrapper label="Link" labelId="evp-share-link-label">
              <ClipboardCopy content={shareUrl} name="evp-share-link" />
            </FormInputWrapper>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <p className={styles.cardHeadingText}>Deine Value Proposition</p>
          </div>
          <div className={styles.cardContent}>
            <p className={styles.bodyText}>
              Unsere KI erstellt einen individuellen Entwurf auf Basis deiner
              Eingaben. Du kannst deine Einstellungen jederzeit anpassen und die
              EVP neu generieren, bis sie dein Unternehmen genau so
              widerspiegelt, wie du es möchtest.
            </p>

            <div className={styles.formFields}>
              <FormInputWrapper
                label="Zielgruppe"
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
                <FormInputWrapper label="Stil" labelId="evp-gen-style-label">
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
                  label="Sprache"
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
                loadingText="Wird generiert…"
                onClick={handleGenerate}
                text="EVP generieren"
              />
            </div>

            {(isLoading || error || evpText) && (
              <div className={styles.previewSection}>
                <p className={styles.previewLabel}>Vorschau</p>

                {isLoading && (
                  <p className={styles.loadingMessage}>EVP wird generiert…</p>
                )}

                {error && <p className={styles.errorMessage}>{error}</p>}

                {evpText && (
                  <>
                    <div className={styles.evpContentBorder}>
                      <div className={styles.evpContent}>
                        <div
                          className={styles.bodyText}
                          dangerouslySetInnerHTML={{
                            __html: formatEvpText(evpText),
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.actionButtons}>
                      <Button
                        color={ButtonColor.PRIMARY}
                        leadingIcon={<Icon icon={Download} />}
                        onClick={handleDownloadPdf}
                        text="PDF herunterladen"
                      />
                    </div>
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
