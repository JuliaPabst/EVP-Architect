# RULE PRIORITY

This document governs ONLY UI component implementation.

For:
- Routing
- Database
- API logic
- LLM calls
- Folder structure outside /app/components

Refer to:
AI_IMPLEMENTATION_GUIDELINES.md

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

---

## Storybook MCP Troubleshooting Guide

### Prerequisites
- **Location:** `/Users/julia.pabst/Desktop/Bachelor thesis/ui/`
- **Configuration:** `.vscode/mcp.json` (in workspace root)
- **Required Addon:** `@storybook/addon-mcp@0.3.3` (already installed)

### Quick Start: Starting Storybook MCP

**Option 1: Start Storybook Dev Server**
```bash
cd "/Users/julia.pabst/Desktop/Bachelor thesis/ui"
npm run start
```
This starts Storybook on `http://localhost:3000` with MCP endpoint at `http://localhost:3000/mcp`

**Option 2: Check if Already Running**
```bash
lsof -i :3000 | grep node
```
If you see a node process, Storybook is already running.

### Verifying MCP Connection

**Step 1: Check VS Code MCP Connection Status**
Look for connection logs in VS Code Output panel:
```
Connection state: Running
```

**Step 2: Verify Storybook Process**
```bash
ps aux | grep storybook | grep -v grep
```
Should show: `node .../storybook dev -p 3000`

**Step 3: Check Port 3000**
```bash
lsof -i :3000
```
Should show node process listening on port 3000.

**Step 4: Test MCP Tools Availability**
In Claude Code, search for tools:
- `get-storybook-story-instructions` - Should return writing guidelines
- `preview-stories` - Should be available for getting story URLs

### Common Issues and Solutions

#### Issue 1: "Storybook MCP tools not found"
**Symptoms:** Cannot find `mcp_storybook_*` tools in Claude Code

**Solutions:**
1. **Start Storybook if not running:**
   ```bash
   cd "/Users/julia.pabst/Desktop/Bachelor thesis/ui"
   npm run start
   ```

2. **Wait for connection:** Check VS Code Output panel for "Connection state: Running"

3. **Restart VS Code:** Sometimes MCP connections need a VS Code restart after starting Storybook

#### Issue 2: "Port 3000 already in use"
**Symptoms:** Cannot start Storybook, port conflict error

**Solutions:**
1. **Find what's using port 3000:**
   ```bash
   lsof -i :3000
   ```

2. **Kill the process if it's a stale Storybook:**
   ```bash
   kill -9 <PID>
   ```
   Replace `<PID>` with the process ID from lsof output

3. **Or use a different port:**
   ```bash
   npm run start -- -p 3001
   ```
   Then update `.vscode/mcp.json` URL to `http://localhost:3001/mcp`

#### Issue 3: "Connection state: Stopped"
**Symptoms:** MCP shows as stopped in VS Code

**Solutions:**
1. **Ensure Storybook is running first** (see Quick Start above)

2. **Restart MCP connection in VS Code:**
   - Open Command Palette (Cmd+Shift+P)
   - Search for "MCP: Restart Server"
   - Select "storybook"

3. **Check mcp.json configuration:**
   ```json
   {
     "servers": {
       "storybook": {
         "type": "http",
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

#### Issue 4: "Only 2 tools available instead of 4+"
**Symptoms:** Only see `get-storybook-story-instructions` and `preview-stories`

**Explanation:** This is NORMAL for Storybook 9.1.17
- **Dev Tools (2):** ✅ Available
  - `get-storybook-story-instructions`
  - `preview-stories`
- **Docs Tools (2):** ❌ Not available (requires Storybook 10.1.0+)
  - `list-all-documentation` (requires upgrade)
  - `get-documentation` (requires upgrade)

**To enable Docs Tools (optional):**
1. Upgrade Storybook:
   ```bash
   cd "/Users/julia.pabst/Desktop/Bachelor thesis/ui"
   npm install storybook@next @storybook/react-webpack5@next
   ```

2. Enable feature flag in `.storybook/main.ts`:
   ```typescript
   export default {
     // ... existing config
     features: {
       experimentalComponentsManifest: true,
     },
   };
   ```

### Diagnostic Commands Reference

**Check if Storybook is Running:**
```bash
ps aux | grep "storybook dev" | grep -v grep
```

**Check Port Status:**
```bash
lsof -i :3000
```

**Check Addon Installation:**
```bash
cd "/Users/julia.pabst/Desktop/Bachelor thesis/ui"
npm list @storybook/addon-mcp
```
Should show: `@storybook/addon-mcp@0.3.3`

**View Storybook Config:**
```bash
cat "/Users/julia.pabst/Desktop/Bachelor thesis/ui/.storybook/main.ts"
```
Should include: `'@storybook/addon-mcp'` in addons array

**Test MCP Endpoint (should hang/wait for input):**
```bash
curl -v http://localhost:3000/mcp
```
Press Ctrl+C to exit. If it connects, endpoint is working.

### Complete Restart Procedure

If all else fails, do a complete restart:

1. **Stop Storybook:**
   ```bash
   # Find the process
   ps aux | grep "storybook dev" | grep -v grep
   # Kill it (use PID from above)
   kill -9 <PID>
   ```

2. **Clear any locks:**
   ```bash
   cd "/Users/julia.pabst/Desktop/Bachelor thesis/ui"
   rm -rf node_modules/.cache
   ```

3. **Restart Storybook:**
   ```bash
   npm run start
   ```

4. **Wait for "webpack compiled" message**

5. **Restart VS Code** (to reconnect MCP)

6. **Verify tools are available** in Claude Code

### Expected Tool Behavior

**`get-storybook-story-instructions`**
- No parameters required
- Returns comprehensive guidelines for writing stories
- Includes CSF3 format, Storybook 9 changes, mocking patterns
- Should work immediately when Storybook is running

**`preview-stories`**
- Requires story information (file path + export name OR story ID)
- Returns clickable URLs to view stories in browser
- Example: `http://localhost:3000/?path=/story/example-button--primary`

### MCP Configuration Location

**File:** `/Users/julia.pabst/Desktop/Bachelor thesis/.vscode/mcp.json`

**Current Configuration:**
```json
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=jntjnblkgvrjgdtjxffy"
    },
    "storybook": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  },
  "inputs": []
}
```

**Note:** MCP configuration is at workspace root, not in ui/ folder

---

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
import styles from './index.module.scss'  // Same folder as index.tsx

// Sub-components (from within parent component)
// In HeaderSection/index.tsx:
import Logo from './Logo'  // Resolves to HeaderSection/Logo/index.tsx
import Navigation from './Navigation'  // Resolves to HeaderSection/Navigation/index.tsx
```

**Import Path Rules:**
- Main components: `'./components/ComponentName'` (from page.tsx)
- Shared components: `'./components/shared/ComponentName'` (from page.tsx)
- Sub-components: `'./SubComponentName'` (from parent component)
- Styles: `'./index.module.scss'` (from same folder as index.tsx)
- @kununu/ui: Full path from @kununu/ui

**Example Component Structure:**
```tsx
// File: components/HeaderSection/index.tsx
import Logo from './Logo'              // Sub-component
import Navigation from './Navigation'  // Sub-component
import Button from '@kununu/ui/atoms/Button'  // kununu component
import styles from './index.module.scss'      // Styles

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
// File: components/HeaderSection/index.module.scss
@use '@kununu/ui/theme/scss/variables/colors';
@use '@kununu/ui/theme/scss/variables/spacings';

.header {
  display: flex;
  padding: spacings.$kun-spacing-m;
  background: colors.$kun-color-bg-white;
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
│   │   ├── index.tsx                # Component code
│   │   ├── index.module.scss        # Component styles
│   │   └── Logo/                    # Sub-component (if needed)
│   │       ├── index.tsx
│   │       └── index.module.scss
│   ├── HeroSection/
│   │   ├── index.tsx
│   │   ├── index.module.scss
│   │   ├── Title/                   # Sub-component
│   │   │   ├── index.tsx
│   │   │   └── index.module.scss
│   │   └── CallToAction/            # Sub-component
│   │       ├── index.tsx
│   │       └── index.module.scss
│   └── shared/                      # Shared/reusable components
│       ├── CustomButton/
│       │   ├── index.tsx
│       │   └── index.module.scss
│       └── IconWrapper/
│           ├── index.tsx
│           └── index.module.scss
└── page.tsx
```

**Component Organization Rules:**
1. **Each component gets its own folder** named with PascalCase (e.g., `HeaderSection/`)
2. **Inside each folder:**
   - `index.tsx` - Component code
   - `index.module.scss` - Component styles
3. **Sub-components** (used only within parent component) go in subfolders:
   - Example: `HeaderSection/Logo/index.tsx`
4. **Shared components** (used across multiple components) go in `components/shared/`:
   - Example: `shared/CustomButton/index.tsx`
5. **Import pattern:** `import HeaderSection from './components/HeaderSection'` (automatically resolves to index.tsx)

**Style Files (DO NOT MODIFY):**
- `apps/web/app/fonts.scss` - Font declarations (already configured)
- `apps/web/app/globals.scss` - Global styles (already configured)
- `apps/web/app/kununu-styles.scss` - Imported @kununu/ui styles (already configured)
- `apps/web/public/fonts/` - Local font files (already present)

**Component Creation Rules:**
1. Extract distinct UI sections into separate component folders
2. Store main components in `app/components/`
3. Store shared/reusable components in `app/components/shared/`
4. Each component folder must have both `index.tsx` and `index.module.scss`
5. Use subfolders for components only used within the parent
6. Compose all components in `page.tsx`
7. Use @kununu/ui components within your custom components

---

## Styling Requirements

### MANDATORY: SCSS Module Files Only

```tsx
// Required import (from same folder as component)
import styles from './index.module.scss'

// Usage
<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

**File Structure:**
- Component: `components/HeaderSection/index.tsx`
- Styles: `components/HeaderSection/index.module.scss`
- Import: `import styles from './index.module.scss'` (relative to index.tsx)

**FORBIDDEN:**
- ❌ Inline styles
- ❌ CSS-in-JS
- ❌ Regular .scss files without .module (must use index.module.scss)
- ❌ Global styles for components

### MANDATORY: Design Tokens Only

**FORBIDDEN:** Magic numbers, hardcoded colors, arbitrary values
**REQUIRED:** Use SCSS variables from @kununu/ui design tokens

**Import Tokens First:**
```scss
@use '@kununu/ui/theme/scss/variables/colors';
@use '@kununu/ui/theme/scss/variables/spacings';
```

**Spacing Variables (REQUIRED):**
```scss
spacings.$kun-spacing-4xs   // 2px
spacings.$kun-spacing-3xs   // 4px
spacings.$kun-spacing-2xs   // 8px
spacings.$kun-spacing-xs    // 12px
spacings.$kun-spacing-s     // 16px
spacings.$kun-spacing-m     // 24px
spacings.$kun-spacing-l     // 32px
spacings.$kun-spacing-xl    // 40px
spacings.$kun-spacing-2xl   // 48px
spacings.$kun-spacing-3xl   // 64px
spacings.$kun-spacing-4xl   // 96px
```

**Color Variables (REQUIRED):**
```scss
// Text colors
colors.$kun-color-text-title        // #1b1c20 - Titles
colors.$kun-color-text-primary      // #333538 - Primary text
colors.$kun-color-text-secondary    // #4a4c4f - Secondary text
colors.$kun-color-text-ondark       // #ffffff - Text on dark backgrounds

// Background colors
colors.$kun-color-bg-white          // #ffffff - White background
colors.$kun-color-bg-soft           // #f7f7f8 - Light grey background
colors.$kun-color-bg-medium         // #e9edef - Medium grey background

// Brand colors
colors.$kun-color-base-coral-90     // #ff734d - Coral light
colors.$kun-color-base-coral-100    // #ff603b - Coral standard
colors.$kun-color-base-yellow-80    // #feca14 - Yellow (kununu yellow)
colors.$kun-color-base-darkblue-100 // #102b69 - Dark blue
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

**Example Component with Tokens:**
```tsx
// File: components/MyComponent/index.tsx
import styles from './index.module.scss';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      <h1 className="h1">Welcome</h1>
      <p className="p-base-regular">This is body text</p>
    </div>
  );
}
```

```scss
// File: components/MyComponent/index.module.scss
@use '@kununu/ui/theme/scss/variables/colors';
@use '@kununu/ui/theme/scss/variables/spacings';

.container {
  padding: spacings.$kun-spacing-l;
  background: colors.$kun-color-bg-white;
  color: colors.$kun-color-text-primary;
}
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
   - Import design tokens with @use in SCSS files
   - Use SCSS token variables for colors and spacing
   - Create custom components only if no @kununu/ui match exists
   - Create folder structure for each component: `ComponentName/index.tsx` + `ComponentName/index.module.scss`
   - Place shared components in `components/shared/` folder
   - Place sub-components in parent component subfolders
5. Update page.tsx to compose all components

### Scenario 3: User Requests Customization of Existing Component
1. Query Figma MCP for selected element
2. Update existing component:
   - Replace placeholder text with Figma content
   - Apply correct typography classes
   - Import design tokens with @use in SCSS
   - Adjust spacing using SCSS token variables
   - Match colors using SCSS token variables
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
- [ ] Will use SCSS module files with index.module.scss naming (not inline styles or CSS-in-JS)
- [ ] Will import design tokens with @use at top of SCSS files
- [ ] Will use SCSS design token variables only (no hardcoded values)
- [ ] Will use typography classes only (no font-family declarations)
- [ ] Will NOT import fonts from external sources
- [ ] Will extract exact text content from Figma
- [ ] Will match Figma hierarchy, spacing, and layout

---

## Code Generation Rules Summary

**ALWAYS:**
- Query Storybook MCP before creating components
- Use @kununu/ui components when available
- Create folder structure: `ComponentName/index.tsx` + `ComponentName/index.module.scss`
- Place shared components in `components/shared/`
- Place sub-components in parent component subfolders
- Use typography classes (h1, p-base-regular, etc.) for all text
- Import design tokens with @use at top of SCSS files
- Use SCSS variables (spacings.$kun-spacing-m, colors.$kun-color-text-title)
- Extract exact text content from Figma
- Match Figma hierarchy and layout exactly

**NEVER:**
- Recreate components that exist in @kununu/ui
- Use inline styles or CSS-in-JS
- Use plain .scss files (must use .module.scss)
- Create flat file structure (use folders for each component)
- Put shared components in main components/ folder (use shared/ subfolder)
- Use hardcoded colors or magic numbers
- Add font-family declarations
- Import fonts from external sources
- Use placeholder text when Figma content is available
