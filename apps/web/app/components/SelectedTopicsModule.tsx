'use client';

import React from 'react';
import Badge, {
  BadgeColor,
  BadgeEmphasis,
  BadgeSize,
} from '@kununu/ui/atoms/Badge';
import {IconType} from '@kununu/ui/atoms/Icon';
import Group from '@kununu/ui/atoms/Icon/Icons/Group';
import Plant from '@kununu/ui/atoms/Icon/Icons/Plant';
import Design from '@kununu/ui/atoms/Icon/Icons/Design';
import Handshake from '@kununu/ui/atoms/Icon/Icons/Handshake';
import Chat from '@kununu/ui/atoms/Icon/Icons/Chat';
import Target from '@kununu/ui/atoms/Icon/Icons/Target';

import styles from './SelectedTopicsModule.module.css';

export interface Topic {
  id: string;
  label: string;
  icon: IconType;
  color: BadgeColor;
}

export interface SelectedTopicsModuleProps {
  /** Array of selected topics to display */
  topics?: Topic[];
  /** Custom heading text */
  heading?: string;
  /** Custom description text */
  description?: string;
}

const defaultTopics: Topic[] = [
  {
    id: 'teamwork',
    label: 'Teamwork',
    icon: Group,
    color: BadgeColor.INFO,
  },
  {
    id: 'sustainability',
    label: 'Sustainability',
    icon: Plant,
    color: BadgeColor.LIGHT_BLUE,
  },
  {
    id: 'creativity',
    label: 'Creativity',
    icon: Design,
    color: BadgeColor.LIGHT_GREEN,
  },
  {
    id: 'trust',
    label: 'Trust',
    icon: Handshake,
    color: BadgeColor.LIGHT_PINK,
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Chat,
    color: BadgeColor.LIGHT_YELLOW,
  },
  {
    id: 'goal-oriented',
    label: 'Goal Oriented',
    icon: Target,
    color: BadgeColor.LIGHT_DARK_BLUE,
  },
];

export default function SelectedTopicsModule({
  topics = defaultTopics,
  heading = "Stop guessing what makes your company special - let your team tell you.",
  description = "This tool analyzes honest feedback from your employees to generate an authentic Employer Value Proposition (EVP) that attracts exactly the right talent.",
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
                <p className={styles.stepsHeading}>How it works in 3 steps:</p>
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
                src="http://localhost:3845/assets/d48e8316a9b9befb9b512ff27b65c453f841d3f9.png"
                alt=""
                className={styles.heroImage}
              />
              <div className={styles.badgeContainer}>
                {topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={styles.badge}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <Badge
                      color={topic.color}
                      emphasis={BadgeEmphasis.SUBTLE}
                      size={BadgeSize.M}
                      icon={topic.icon}
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
