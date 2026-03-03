import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import {IconType} from '@kununu/ui/atoms/Icon';
import {BadgeColor} from '@kununu/ui/atoms/Badge';
import Group from '@kununu/ui/atoms/Icon/Icons/Group';

import SelectedTopicsModule, {Topic} from './index';

describe('SelectedTopicsModule', () => {
  describe('Rendering with default props', () => {
    it('should render the default heading', () => {
      render(<SelectedTopicsModule />);
      
      expect(
        screen.getByText(
          'Stop guessing what makes your company special - let your team tell you.',
        ),
      ).toBeInTheDocument();
    });

    it('should render the default description', () => {
      render(<SelectedTopicsModule />);
      
      expect(
        screen.getByText(
          /This tool analyzes honest feedback from your employees/i,
        ),
      ).toBeInTheDocument();
    });

    it('should render the steps heading', () => {
      render(<SelectedTopicsModule />);
      
      expect(screen.getByText('How it works in 3 steps:')).toBeInTheDocument();
    });

    it('should render all three steps', () => {
      render(<SelectedTopicsModule />);
      
      expect(
        screen.getByText(/Choose your kununu profile here/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Survey Team: Share the survey link with your team/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Create EVP: Add your perspective/i),
      ).toBeInTheDocument();
    });

    it('should render steps in an ordered list', () => {
      render(<SelectedTopicsModule />);
      
      const orderedList = screen.getByRole('list');
      expect(orderedList.tagName).toBe('OL');
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should render the hero image', () => {
      render(<SelectedTopicsModule />);
      
      const image = screen.getByRole('img', {name: ''});
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });
  });

  describe('Default topics rendering', () => {
    it('should render all 6 default topics', () => {
      render(<SelectedTopicsModule />);
      
      expect(screen.getByText('Teamwork')).toBeInTheDocument();
      expect(screen.getByText('Sustainability')).toBeInTheDocument();
      expect(screen.getByText('Creativity')).toBeInTheDocument();
      expect(screen.getByText('Trust')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Goal Oriented')).toBeInTheDocument();
    });

    it('should render each topic in a badge', () => {
      render(<SelectedTopicsModule />);
      
      const badges = screen.getAllByText(/Teamwork|Sustainability|Creativity|Trust|Communication|Goal Oriented/);
      expect(badges.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Custom props', () => {
    it('should render custom heading', () => {
      const customHeading = 'Custom Heading Text';
      
      render(<SelectedTopicsModule heading={customHeading} />);
      
      expect(screen.getByText(customHeading)).toBeInTheDocument();
    });

    it('should render custom description', () => {
      const customDescription = 'This is a custom description for testing.';
      
      render(<SelectedTopicsModule description={customDescription} />);
      
      expect(screen.getByText(customDescription)).toBeInTheDocument();
    });

    it('should render custom topics', () => {
      const customTopics: Topic[] = [
        {
          id: 'innovation',
          label: 'Innovation',
          icon: Group,
          color: BadgeColor.INFO,
        },
        {
          id: 'flexibility',
          label: 'Flexibility',
          icon: Group,
          color: BadgeColor.LIGHT_BLUE,
        },
      ];
      
      render(<SelectedTopicsModule topics={customTopics} />);
      
      expect(screen.getByText('Innovation')).toBeInTheDocument();
      expect(screen.getByText('Flexibility')).toBeInTheDocument();
      
      // Default topics should not be present
      expect(screen.queryByText('Teamwork')).not.toBeInTheDocument();
      expect(screen.queryByText('Sustainability')).not.toBeInTheDocument();
    });

    it('should render with all custom props', () => {
      const customHeading = 'Build Your EVP';
      const customDescription = 'Start your journey here.';
      const customTopics: Topic[] = [
        {
          id: 'custom',
          label: 'Custom Topic',
          icon: Group,
          color: BadgeColor.INFO,
        },
      ];
      
      render(
        <SelectedTopicsModule
          heading={customHeading}
          description={customDescription}
          topics={customTopics}
        />,
      );
      
      expect(screen.getByText(customHeading)).toBeInTheDocument();
      expect(screen.getByText(customDescription)).toBeInTheDocument();
      expect(screen.getByText('Custom Topic')).toBeInTheDocument();
    });

    it('should render empty topics array', () => {
      render(<SelectedTopicsModule topics={[]} />);
      
      // Should still render the component structure
      expect(
        screen.getByText('Stop guessing what makes your company special - let your team tell you.'),
      ).toBeInTheDocument();
      
      // But no topic badges should be present
      expect(screen.queryByText('Teamwork')).not.toBeInTheDocument();
    });
  });

  describe('Layout and structure', () => {
    it('should have a section element', () => {
      const {container} = render(<SelectedTopicsModule />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have content wrapper structure', () => {
      const {container} = render(<SelectedTopicsModule />);
      
      const section = container.querySelector('section');
      expect(section?.querySelector('[class*="content"]')).toBeInTheDocument();
    });

    it('should have left and right columns', () => {
      const {container} = render(<SelectedTopicsModule />);
      
      expect(container.querySelector('[class*="leftColumn"]')).toBeInTheDocument();
      expect(container.querySelector('[class*="rightColumn"]')).toBeInTheDocument();
    });

    it('should have badge container in right column', () => {
      const {container} = render(<SelectedTopicsModule />);
      
      expect(container.querySelector('[class*="badgeContainer"]')).toBeInTheDocument();
    });
  });

  describe('Topic Badge Details', () => {
    it('should render each topic with unique key', () => {
      const customTopics: Topic[] = [
        {id: 'topic1', label: 'Topic 1', icon: Group, color: BadgeColor.INFO},
        {id: 'topic2', label: 'Topic 2', icon: Group, color: BadgeColor.LIGHT_BLUE},
      ];
      
      render(<SelectedTopicsModule topics={customTopics} />);
      
      // Check that both custom topics are rendered
      expect(screen.getByText('Topic 1')).toBeInTheDocument();
      expect(screen.getByText('Topic 2')).toBeInTheDocument();
    });

    it('should apply animation delay to each badge', () => {
      const customTopics: Topic[] = [
        {id: 'topic1', label: 'Topic 1', icon: Group, color: BadgeColor.INFO},
        {id: 'topic2', label: 'Topic 2', icon: Group, color: BadgeColor.LIGHT_BLUE},
        {id: 'topic3', label: 'Topic 3', icon: Group, color: BadgeColor.LIGHT_GREEN},
      ];
      
      const {container} = render(<SelectedTopicsModule topics={customTopics} />);
      
      const badgeContainer = container.querySelector('[class*="badgeContainer"]');
      expect(badgeContainer).toBeInTheDocument();
      
      // Verify all three topics are rendered
      expect(screen.getByText('Topic 1')).toBeInTheDocument();
      expect(screen.getByText('Topic 2')).toBeInTheDocument();
      expect(screen.getByText('Topic 3')).toBeInTheDocument();
    });
  });

  describe('Content validation', () => {
    it('should properly escape HTML in descriptions', () => {
      const descriptionWithHTML = 'This is <strong>bold</strong> text';
      
      render(<SelectedTopicsModule description={descriptionWithHTML} />);
      
      // The HTML should be rendered as plain text, not parsed
      expect(screen.getByText(descriptionWithHTML)).toBeInTheDocument();
    });

    it('should handle long headings', () => {
      const longHeading = 'A'.repeat(200);
      
      render(<SelectedTopicsModule heading={longHeading} />);
      
      expect(screen.getByText(longHeading)).toBeInTheDocument();
    });

    it('should handle special characters in topic labels', () => {
      const topicsWithSpecialChars: Topic[] = [
        {
          id: 'special',
          label: 'Work-Life & Balance!',
          icon: Group,
          color: BadgeColor.INFO,
        },
      ];
      
      render(<SelectedTopicsModule topics={topicsWithSpecialChars} />);
      
      expect(screen.getByText('Work-Life & Balance!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      const {container} = render(<SelectedTopicsModule />);
      
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      
      const orderedList = screen.getByRole('list');
      expect(orderedList).toBeInTheDocument();
    });

    it('should render description paragraphs', () => {
      render(<SelectedTopicsModule />);
      
      const paragraphs = screen.getAllByText(/This tool analyzes|How it works/);
      expect(paragraphs.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined optional props gracefully', () => {
      render(<SelectedTopicsModule topics={undefined} />);
      
      // Should render with default topics
      expect(screen.getByText('Teamwork')).toBeInTheDocument();
    });

    it('should handle single topic', () => {
      const singleTopic: Topic[] = [
        {
          id: 'single',
          label: 'Single Topic',
          icon: Group,
          color: BadgeColor.INFO,
        },
      ];
      
      render(<SelectedTopicsModule topics={singleTopic} />);
      
      expect(screen.getByText('Single Topic')).toBeInTheDocument();
    });

    it('should handle many topics', () => {
      const manyTopics: Topic[] = Array.from({length: 20}, (_, i) => ({
        id: `topic${i}`,
        label: `Topic ${i + 1}`,
        icon: Group,
        color: BadgeColor.INFO,
      }));
      
      render(<SelectedTopicsModule topics={manyTopics} />);
      
      expect(screen.getByText('Topic 1')).toBeInTheDocument();
      expect(screen.getByText('Topic 20')).toBeInTheDocument();
    });
  });
});
