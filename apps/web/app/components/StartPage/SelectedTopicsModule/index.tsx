'use client';

import Badge, {
  BadgeColor,
  BadgeEmphasis,
  BadgeSize,
} from '@kununu/ui/atoms/Badge';
import {IconType} from '@kununu/ui/atoms/Icon';
import Chat from '@kununu/ui/atoms/Icon/Icons/Chat';
import Design from '@kununu/ui/atoms/Icon/Icons/Design';
import Group from '@kununu/ui/atoms/Icon/Icons/Group';
import Handshake from '@kununu/ui/atoms/Icon/Icons/Handshake';
import Plant from '@kununu/ui/atoms/Icon/Icons/Plant';
import Target from '@kununu/ui/atoms/Icon/Icons/Target';
import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import styles from './index.module.scss';

export interface Topic {
  readonly color: BadgeColor;
  readonly icon: IconType;
  readonly id: string;
  readonly label: string;
}

export interface SelectedTopicsModuleProps {
  /** Custom description text */
  readonly description?: string;
  /** Custom heading text */
  readonly heading?: string;
  /** Array of selected topics to display */
  readonly topics?: Topic[];
}

const defaultTopics: Topic[] = [
  {
    color: BadgeColor.INFO,
    icon: Group,
    id: 'teamwork',
    label: 'Teamwork',
  },
  {
    color: BadgeColor.LIGHT_BLUE,
    icon: Plant,
    id: 'sustainability',
    label: 'Sustainability',
  },
  {
    color: BadgeColor.LIGHT_GREEN,
    icon: Design,
    id: 'creativity',
    label: 'Creativity',
  },
  {
    color: BadgeColor.LIGHT_PINK,
    icon: Handshake,
    id: 'trust',
    label: 'Trust',
  },
  {
    color: BadgeColor.LIGHT_YELLOW,
    icon: Chat,
    id: 'communication',
    label: 'Communication',
  },
  {
    color: BadgeColor.LIGHT_DARK_BLUE,
    icon: Target,
    id: 'goal-oriented',
    label: 'Goal Oriented',
  },
];

export default function SelectedTopicsModule({
  description = 'This tool analyzes honest feedback from your employees to generate an authentic Employer Value Proposition (EVP) that attracts exactly the right talent.',
  heading = 'Stop guessing what makes your company special - let your team tell you.',
  topics = defaultTopics,
}: SelectedTopicsModuleProps) {
  return (
    <section className={styles.topicsModule} data-testid="topics-module">
      <div className={styles.content} data-testid="topics-content">
        <div className={styles.contentWrapper}>
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.leftColumn} data-testid="left-column">
                <h3 className={styles.heading}>{heading}</h3>
                <div className={styles.description}>
                  <p>{description}</p>
                  <p className={styles.stepsHeading}>
                    How it works in 3 steps:
                  </p>
                  <ol className={styles.stepsList}>
                    <li>
                      Choose your kununu profile here. We use this as the basis
                      for &quot;Hard Facts&quot; (e.g., industry, location).
                    </li>
                    <li>Survey Team: Share the survey link with your team.</li>
                    <li>
                      Create EVP: Add your perspective and generate your EVP
                      below.
                    </li>
                  </ol>
                </div>
              </div>
              <div className={styles.rightColumn} data-testid="right-column">
                <div className={styles.heroImage}>
                  {' '}
                  <img alt="" src="/hero-image-placeholder.png" />{' '}
                  <UnunuBackground color={UnunuBackgroundColors.WHITE} />
                </div>
                <div
                  className={styles.badgeContainer}
                  data-testid="badge-container"
                >
                  {topics.map((topic, index) => (
                    <div
                      className={styles.badge}
                      key={topic.id}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      <Badge
                        color={topic.color}
                        emphasis={BadgeEmphasis.SUBTLE}
                        icon={topic.icon}
                        size={BadgeSize.M}
                        text={topic.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
