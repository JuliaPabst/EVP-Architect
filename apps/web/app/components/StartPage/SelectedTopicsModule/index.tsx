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

import styles from './index.module.scss';

export interface Topic {
  color: BadgeColor;
  icon: IconType;
  id: string;
  label: string;
}

export interface SelectedTopicsModuleProps {
  /** Custom description text */
  description?: string;
  /** Custom heading text */
  heading?: string;
  /** Array of selected topics to display */
  topics?: Topic[];
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
    <section className={styles.topicsModule}>
      <div className={styles.content}>
        <div className={styles.contentWrapper}>
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.leftColumn}>
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
              <div className={styles.rightColumn}>
                <img
                  alt=""
                  className={styles.heroImage}
                  src="http://localhost:3845/assets/d48e8316a9b9befb9b512ff27b65c453f841d3f9.png"
                />
                <div className={styles.badgeContainer}>
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
