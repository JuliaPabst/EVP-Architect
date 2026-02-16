# Technical Development Guidelines for GitHub Copilot

**Purpose:** This file contains strict technical requirements for building components from Figma designs using the kununu design system. Follow these rules exactly when generating code.

---

## CRITICAL: Component Selection Priority

**MANDATORY FIRST STEP:** Query Storybook MCP for available components before generating any code.

**Component Selection Rules:**
1. ALWAYS use @kununu/ui components when available (Button, Header, Logo, Divider, Icon, HeroSection, Card, etc.)
2. NEVER recreate a component that exists in @kununu/ui
3. Only create custom components when:
   - No suitable @kununu/ui component exists
   - User explicitly requests custom implementation
   - After confirming with user that no library component matches
4. When building custom components, compose them using @kununu/ui atoms

## Required Import Patterns

```tsx
// @kununu/ui Components
import Button from '@kununu/ui/atoms/Button'
import Header from '@kununu/ui/organisms/Header'
import HeroSection from '@kununu/ui/molecules/HeroSection'
import Card from '@kununu/ui/atoms/Card'

// Icons
import KununuLogo from '@kununu/ui/particles/Icons/KununuLogo'
import [IconName] from '@kununu/ui/particles/Icons/[IconName]'

// Illustrations
import Heart from '@kununu/ui/Illustration/Illustrations/Spot/Heart'
import [IllustrationName] from '@kununu/ui/Illustration/Illustrations/Spot/[IllustrationName]'

// Custom Components (from page.tsx)
import HeaderSection from './components/HeaderSection'        // Resolves to HeaderSection/index.tsx
import HeroSection from './components/HeroSection'
import CustomButton from './components/shared/CustomButton'  // Shared component

// Styles (from within component folder)
import styles from './index.scss'  // Same folder as index.tsx

// Sub-components (from within parent component)
// In HeaderSection/index.tsx:
import Logo from './Logo'  // Resolves to HeaderSection/Logo/index.tsx
import Navigation from './Navigation'  // Resolves to HeaderSection/Navigation/index.tsx
```

**Import Path Rules:**
- Main components: `'./components/ComponentName'` (from page.tsx)
- Shared components: `'./components/shared/ComponentName'` (from page.tsx)
- Sub-components: `'./SubComponentName'` (from parent component)
- Styles: `'./index.scss'` (from same folder as index.tsx)
- @kununu/ui: Full path from @kununu/ui

**Example Component Structure:**
```tsx
// File: components/HeaderSection/index.tsx
import Logo from './Logo'              // Sub-component
import Navigation from './Navigation'  // Sub-component
import Button from '@kununu/ui/atoms/Button'  // kununu component
import styles from './index.scss'      // Styles

export default function HeaderSection() {
  return (
    <header className={styles.header}>
      <Logo />
      <Navigation />
      <Button>CTA</Button>
    </header>
  );
}
```

```scss
// File: components/HeaderSection/index.scss
.header {
  display: flex;
  padding: var(--spacings-space-m, 24px);
  background: var(--background-white, white);
}
```

---

## Mandatory File Structure

**Primary Entry Point:**
- `apps/web/app/page.tsx` - Main page that composes all components

**Component Folder Structure:**
```
app/
├── components/
│   ├── HeaderSection/
│   │   ├── index.tsx          # Component code
│   │   ├── index.scss         # Component styles
│   │   └── Logo/              # Sub-component (if needed)
│   │       ├── index.tsx
│   │       └── index.scss
│   ├── HeroSection/
│   │   ├── index.tsx
│   │   ├── index.scss
│   │   ├── Title/             # Sub-component
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   └── CallToAction/      # Sub-component
│   │       ├── index.tsx
│   │       └── index.scss
│   └── shared/                # Shared/reusable components
│       ├── CustomButton/
│       │   ├── index.tsx
│       │   └── index.scss
│       └── IconWrapper/
│           ├── index.tsx
│           └── index.scss
└── page.tsx
```

**Component Organization Rules:**
1. **Each component gets its own folder** named with PascalCase (e.g., `HeaderSection/`)
2. **Inside each folder:**
   - `index.tsx` - Component code
   - `index.scss` - Component styles
3. **Sub-components** (used only within parent component) go in subfolders:
   - Example: `HeaderSection/Logo/index.tsx`
4. **Shared components** (used across multiple components) go in `components/shared/`:
   - Example: `shared/CustomButton/index.tsx`
5. **Import pattern:** `import HeaderSection from './components/HeaderSection'` (automatically resolves to index.tsx)

**Style Files (DO NOT MODIFY):**
- `apps/web/app/fonts.css` - Font declarations (already configured)
- `apps/web/app/globals.css` - Global styles (already configured)
- `apps/web/public/fonts/` - Local font files (already present)

**Component Creation Rules:**
1. Extract distinct UI sections into separate component folders
2. Store main components in `app/components/`
3. Store shared/reusable components in `app/components/shared/`
4. Each component folder must have both `index.tsx` and `index.scss`
5. Use subfolders for components only used within the parent
6. Compose all components in `page.tsx`
7. Use @kununu/ui components within your custom components

---

## Styling Requirements

### MANDATORY: SCSS Files Only

```tsx
// Required import (from same folder as component)
import styles from './index.scss'

// Usage
<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

**File Structure:**
- Component: `components/HeaderSection/index.tsx`
- Styles: `components/HeaderSection/index.scss`
- Import: `import styles from './index.scss'` (relative to index.tsx)

**FORBIDDEN:**
- ❌ Inline styles
- ❌ CSS-in-JS
- ❌ .module.scss files (use index.scss instead)
- ❌ Global styles for components

### MANDATORY: Design Tokens Only

**FORBIDDEN:** Magic numbers, hardcoded colors, arbitrary values
**REQUIRED:** Use CSS variables from kununu design system

**Spacing Variables (REQUIRED):**
```scss
var(--spacings-space-xs, 8px)   // Use for tight spacing
var(--spacings-space-s, 16px)   // Use for small spacing
var(--spacings-space-m, 24px)   // Use for medium spacing
var(--spacings-space-l, 32px)   // Use for large spacing
var(--spacings-space-xl, 48px)  // Use for extra large spacing
```

**Color Variables (REQUIRED):**
```scss
var(--text-ondark, white)          // Text on dark backgrounds
var(--text-onlight, #333)          // Text on light backgrounds
var(--base-coral-90, #ff734d)      // Primary brand color (light)
var(--base-coral-100, #ff5a32)     // Primary brand color (standard)
var(--background-white, white)     // White background
var(--background-grey-10, #f7f7f7) // Light grey background
```

**Font Size (REQUIRED):**
- Extract explicit font-size values from Figma
- Use pixel values: `font-size: 18px;` or `font-size: 24px;`
- Match Figma specifications exactly

---

## Typography and Fonts

### CRITICAL: Font Configuration

**Fonts Used:**
- Sharp Grotesk 23 & 19 (headings)
- InterUI (body text)

**FORBIDDEN:**
- ❌ Importing fonts from external sources
- ❌ Linking to CDNs (Google Fonts, etc.)
- ❌ Adding font-family to custom SCSS
- ❌ Modifying fonts.css
- ❌ Adding new @font-face declarations

**REQUIRED:**
- ✅ Use typography classes only (fonts already configured)
- ✅ Fonts are in `/apps/web/public/fonts/` (do not modify)
- ✅ Font loading is in `/apps/web/app/fonts.css` (do not modify)

### Typography Classes (MANDATORY USE)

**Available Classes:**

```scss
// Headings (Sharp Grotesk)
.h1              // Largest headings
.h2              // Large headings
.h3-semibold     // Medium headings (semi-bold)
.h3-medium       // Medium headings (medium weight)
.h4-semibold     // Small headings (semi-bold)
.h4-medium       // Small headings (medium weight)
.h5              // Smaller headings
.h6              // Smallest headings

// Body Text (InterUI)
.p-base-regular   // Standard paragraph text
.p-base-semibold  // Semi-bold paragraph
.p-base-bold      // Bold paragraph
.p-small-regular  // Small text
.p-tiny-regular   // Tiny text

// UI Text (InterUI)
.legend-regular   // Form labels
.helper-regular   // Helper/hint text
.button           // Button text
.chip             // Chip/tag text
```

**Implementation:**
```tsx
// CORRECT
<h1 className="h1">Heading Text</h1>
<p className="p-base-regular">Body text</p>

// FORBIDDEN
<h1 style={{fontFamily: 'Sharp Grotesk'}}>Heading</h1>
<h1 className={styles.customHeading}>Heading</h1> // where customHeading uses font-family
```

**What Typography Classes Provide:**
- font-family (Sharp Grotesk or InterUI)
- font-size (matching Figma specs)
- font-weight
- line-height
- letter-spacing

---

## Design Fidelity Requirements

**MANDATORY: Match Figma Exactly**

1. **Content:** Extract and use exact text from Figma (no placeholders unless building skeleton)
2. **Hierarchy:** Maintain exact DOM order matching Figma layer order
3. **Spacing:** Use design tokens to match spacing from Figma
4. **Layout:** Preserve visual structure (flex, grid, positioning)
5. **Typography:** Apply correct typography classes matching Figma text styles
6. **Colors:** Use design token variables matching Figma colors

**Illustrations:**
- For decorative graphics/icons, import from @kununu/ui Illustrations
- Match illustration names to visual elements in Figma
- Import path: `@kununu/ui/Illustration/Illustrations/Spot/[Name]`

```tsx
// Example
import Heart from '@kununu/ui/Illustration/Illustrations/Spot/Heart'
import Rocket from '@kununu/ui/Illustration/Illustrations/Spot/Rocket'
```

---

## Implementation Workflow

**When User Requests Component Implementation:**

### Scenario 1: User Asks Which Component to Use
1. Query Storybook MCP for matching @kununu/ui component
2. Provide component name and basic props
3. Show implementation skeleton using @kununu/ui component
4. Include necessary imports and SCSS module structure
5. Wait for user confirmation before proceeding

### Scenario 2: User Requests Full Figma Recreation
1. **FIRST:** Query Storybook MCP for available components
2. **THEN:** Query Figma MCP for selected design
3. Identify matching @kununu/ui components for each section
4. Generate complete implementation:
   - Use @kununu/ui components as foundation
   - Extract exact text content from Figma
   - Apply typography classes matching Figma styles
   - Use design tokens for colors and spacing
   - Create custom components only if no @kununu/ui match exists
   - Create folder structure for each component: `ComponentName/index.tsx` + `ComponentName/index.scss`
   - Place shared components in `components/shared/` folder
   - Place sub-components in parent component subfolders
5. Update page.tsx to compose all components

### Scenario 3: User Requests Customization of Existing Component
1. Query Figma MCP for selected element
2. Update existing component:
   - Replace placeholder text with Figma content
   - Apply correct typography classes
   - Adjust spacing using design tokens
   - Match colors using design token variables
   - Remove unused parts not in Figma design
   - Maintain @kununu/ui component structure

---

## Pre-Implementation Checklist

**Before generating any code, verify:**

- [ ] Queried Storybook MCP for available @kununu/ui components
- [ ] Selected appropriate @kununu/ui component (or confirmed none exists)
- [ ] Queried Figma MCP for design content (if recreating from Figma)
- [ ] Identified which components are shared (go in `shared/` folder)
- [ ] Identified sub-components (go in parent component subfolders)
- [ ] Will use SCSS files with index.scss naming (not inline styles or CSS-in-JS)
- [ ] Will use design tokens only (no hardcoded values)
- [ ] Will use typography classes only (no font-family declarations)
- [ ] Will NOT import fonts from external sources
- [ ] Will extract exact text content from Figma
- [ ] Will match Figma hierarchy, spacing, and layout

---

## Code Generation Rules Summary

**ALWAYS:**
- Query Storybook MCP before creating components
- Use @kununu/ui components when available
- Create folder structure: `ComponentName/index.tsx` + `ComponentName/index.scss`
- Place shared components in `components/shared/`
- Place sub-components in parent component subfolders
- Use typography classes (h1, p-base-regular, etc.) for all text
- Use design token CSS variables for colors and spacing
- Extract exact text content from Figma
- Match Figma hierarchy and layout exactly

**NEVER:**
- Recreate components that exist in @kununu/ui
- Use inline styles or CSS-in-JS
- Use .module.scss naming (use index.scss instead)
- Create flat file structure (use folders for each component)
- Put shared components in main components/ folder (use shared/ subfolder)
- Use hardcoded colors or magic numbers
- Add font-family declarations
- Import fonts from external sources
- Use placeholder text when Figma content is available
