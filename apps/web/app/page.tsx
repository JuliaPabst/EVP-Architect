'use client';

import React from 'react';
import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';
import HeaderCTA from '@kununu/ui/organisms/Header/HeaderCTA';
import HeaderMenu from '@kununu/ui/organisms/Header/HeaderMenu';
import Subnav from '@kununu/ui/molecules/Subnav';
import HeroSection from '@kununu/ui/molecules/HeroSection';
import Carousel from '@kununu/ui/molecules/Carousel';
import ProfileCard from '@kununu/ui/compositions/ProfileCard';
import { UnunuBackgroundColors } from '@kununu/ui/atoms/UnunuBackground';
import { TopCompanyYear } from '@kununu/ui/atoms/TopCompanyBadge';
import { BadgeColor, BadgeEmphasis } from '@kununu/ui/atoms/Badge';

// Sample data for profile cards
const sampleProfiles = [
  {
    name: 'Expedia Logistics Experts International',
    industry: 'Logistics & Transportation',
    location: { firstLine: 'Munich, Germany' },
    logo: 'https://picsum.photos/80/80?random=1',
    headerImage: 'https://picsum.photos/312/120?random=1',
    score: { roundedScore: 4, score: '4.0' },
    numberOfReviews: 1234,
    badges: [
      { color: BadgeColor.SUCCESS, emphasis: BadgeEmphasis.STRONG, text: '90% Match' },
      { color: BadgeColor.INFO, emphasis: BadgeEmphasis.SUBTLE, text: 'Label' },
    ],
    isVerified: true,
    topCompanyYear: TopCompanyYear.YEAR_2025,
  },
  {
    name: 'Tech Solutions GmbH',
    industry: 'Information Technology',
    location: { firstLine: 'Berlin, Germany' },
    logo: 'https://picsum.photos/80/80?random=2',
    headerImage: 'https://picsum.photos/312/120?random=2',
    score: { roundedScore: 4.5, score: '4.5' },
    numberOfReviews: 876,
    badges: [
      { color: BadgeColor.SUCCESS, emphasis: BadgeEmphasis.STRONG, text: '85% Match' },
    ],
    isVerified: true,
    topCompanyYear: TopCompanyYear.YEAR_2025,
  },
  {
    name: 'Innovation Corp',
    industry: 'Consulting',
    location: { firstLine: 'Hamburg, Germany' },
    logo: 'https://picsum.photos/80/80?random=3',
    headerImage: 'https://picsum.photos/312/120?random=3',
    score: { roundedScore: 3.5, score: '3.5' },
    numberOfReviews: 543,
    badges: [
      { color: BadgeColor.INFO, emphasis: BadgeEmphasis.SUBTLE, text: 'Label' },
    ],
    isVerified: false,
    topCompanyYear: TopCompanyYear.YEAR_2025,
  },
  {
    name: 'Digital Services AG',
    industry: 'Software Development',
    location: { firstLine: 'Frankfurt, Germany' },
    logo: 'https://picsum.photos/80/80?random=4',
    headerImage: 'https://picsum.photos/312/120?random=4',
    score: { roundedScore: 4, score: '4.2' },
    numberOfReviews: 2345,
    badges: [
      { color: BadgeColor.SUCCESS, emphasis: BadgeEmphasis.STRONG, text: '92% Match' },
      { color: BadgeColor.INFO, emphasis: BadgeEmphasis.SUBTLE, text: 'Remote' },
    ],
    isVerified: true,
  },
  {
    name: 'Future Technologies',
    industry: 'Artificial Intelligence',
    location: { firstLine: 'Stuttgart, Germany' },
    logo: 'https://picsum.photos/80/80?random=5',
    headerImage: 'https://picsum.photos/312/120?random=5',
    score: { roundedScore: 4.5, score: '4.7' },
    numberOfReviews: 3456,
    badges: [
      { color: BadgeColor.SUCCESS, emphasis: BadgeEmphasis.STRONG, text: '95% Match' },
    ],
    isVerified: true,
    topCompanyYear: TopCompanyYear.YEAR_2025,
  },
  {
    name: 'Global Enterprises Ltd',
    industry: 'Finance',
    location: { firstLine: 'Düsseldorf, Germany' },
    logo: 'https://picsum.photos/80/80?random=6',
    headerImage: 'https://picsum.photos/312/120?random=6',
    score: { roundedScore: 3, score: '3.8' },
    numberOfReviews: 987,
    badges: [
      { color: BadgeColor.INFO, emphasis: BadgeEmphasis.SUBTLE, text: 'Banking' },
    ],
    isVerified: true,
  },
];

export default function Home() {
  const handleFollow = (index: number) => {
    console.log(`Follow button clicked for profile ${index}`);
  };

  return (
    <>
      <Header
        logo={
          <HeaderLogo
            href="/"
            label="Go to kununu"
            motto="Let's make work better."
          />
        }
        menu={
          <HeaderMenu
            openButtonAriaLabel="Open menu"
            closeButtonAriaLabel="Close menu"
            login={{
              href: "#",
              label: "Login"
            }}
            sections={[
              {
                title: 'Über kununu',
                isExpanded: true,
                links: [
                  { href: '#', title: 'Was ist kununu?' },
                  { href: '#', title: 'Unser Arbeitgeberprofil' },
                  { href: '#', title: 'News' },
                  { href: '#', title: 'Presse' },
                  { href: '#', title: 'Karriere' },
                  { href: '#', title: 'Richtlinien' },
                  { href: '#', title: 'Support & Kontakt' },
                ]
              },
              {
                title: 'Für Arbeitgeber',
                isExpanded: false,
                links: [
                  { href: '#', title: 'Arbeitgeberportal' },
                  { href: '#', title: 'Top Company-Siegel' },
                  { href: '#', title: 'Kostenloses Arbeitgeberprofil' },
                  { href: '#', title: 'Employer Branding Profil' },
                  { href: '#', title: 'Support für Arbeitgeber' },
                  { href: '#', title: 'Arbeitgeber-Newsletter' },
                ]
              }
            ]}
          />
        }
        cta={
          <HeaderCTA
            href="#"
            text="Arbeitgeber bewerten"
          />
        }
        subnav={
          <Subnav
            items={[
              {
                id: '1',
                label: 'Arbeitgeber finden',
                url: '#'
              },
              {
                id: '2',
                label: 'Gehaltscheck',
                url: '#'
              },
              {
                id: '3',
                label: 'Jobs',
                url: '#'
              },
              {
                id: '4',
                label: 'News',
                url: '#'
              },
              {
                id: '5',
                label: 'Über kununu',
                url: '#'
              },
              {
                id: '6',
                label: 'Für Arbeitgeber',
                hasSeparator: true,
                url: '#'
              }
            ]}
          />
        }
      />
      <main style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Hero Section */}
      <HeroSection
        backgroundColor={UnunuBackgroundColors.YELLOW}
        headline={<h1 className="h1">This is a test for the mcp</h1>}
        content={
          <>
            <h5 className="h5" style={{ marginBottom: '16px' }}>
              Beste Arbeitgeber in Deutschland 2023
            </h5>
            <p className="paragraph-base-regular" style={{ marginBottom: '16px' }}>
              kununu zeichnet die besten Arbeitgeber mit dem Top Company Siegel aus. 
              Rund 5% aller Arbeitgeberprofile erhalten diese Auszeichnung ausschließlich 
              auf Basis von kununu Bewertungen.
            </p>
            <div
              style={{
                backgroundColor: '#f7f7f8',
                padding: '8px 16px',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <p className="legend-regular" style={{ color: '#606063' }}>
                Mehr Informationen zum{' '}
                <a
                  href="#"
                  style={{
                    color: '#3c4ee3',
                    textDecoration: 'underline',
                  }}
                >
                  Top Company Siegel für Arbeitgeber
                </a>
                .
              </p>
            </div>
          </>
        }
        dataTestId="hero-section"
      />

      {/* Carousel with Profile Cards */}
      <div style={{ padding: '48px 40px', maxWidth: '1440px', margin: '0 auto' }}>
        <Carousel
          ariaAttributes={{ 'aria-label': 'Top Companies Carousel' }}
          dataTestId="profile-cards-carousel"
          slidesToShow={3}
          responsive={[
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
              },
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 2,
              },
            },
            {
              breakpoint: 1280,
              settings: {
                slidesToShow: 3,
              },
            },
          ]}
        >
          {sampleProfiles.map((profile, index) => (
            <ProfileCard
              key={index}
              name={profile.name}
              industry={profile.industry}
              location={profile.location}
              logo={profile.logo}
              headerImage={profile.headerImage}
              score={profile.score}
              numberOfReviews={profile.numberOfReviews}
              badges={profile.badges}
              isVerified={profile.isVerified}
              topCompanyYear={profile.topCompanyYear}
              follow={{
                isFollowing: false,
                onClick: () => handleFollow(index),
              }}
              links={{
                profileOverview: { href: '#' },
              }}
              dataTestId={`profile-card-${index}`}
            />
          ))}
        </Carousel>
      </div>
    </main>
    </>
  );
}
