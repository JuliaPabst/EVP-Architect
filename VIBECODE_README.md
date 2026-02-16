# Build Prototypes with Copilot, Figma & Storybook

This repo helps designers create interactive prototypes by connecting Figma designs with GitHub Copilot and the kununu UI component library.

You can recreate your Figma designs as working code in just a few hours.

🎨 ➝ 💻

📘 **Quick Start:** All technical rules for Copilot are in **COPILOT_INSTRUCTIONS.md**.  
Always reference this file in your prompts.

## What You'll Be Able to Do

- Connect Figma directly to Copilot
- Use real `@kununu/ui` components automatically
- Recreate entire Figma pages as working code
- See your prototype running in the browser
- Iterate quickly through conversation
- Build professional prototypes without manually coding everything

## How This Works (Simple Explanation)

You are using MCP servers to give Copilot access to:

- Your open Figma file (via Figma Desktop)
- The kununu Storybook component library

Without MCP, Copilot guesses.  
With MCP, Copilot uses real data from Figma and real UI components.

You don’t need to understand the backend.  
You just need to:

- Keep Figma Desktop open
- Keep Storybook running
- Give clear instructions

## Prerequisites (What You Need First)

Install these before starting:

- **Visual Studio Code (VS Code)**  
  https://code.visualstudio.com/
- **GitHub Copilot Extension**  
  Installed in VS Code  
  GitHub account required  
  Active Copilot subscription from kununu
- **Node.js (v18 or higher)**  
  https://nodejs.org/
- **pnpm (package manager)**  
  After installing Node:
  ```bash
  npm install -g pnpm
  ```
- **Figma Desktop App**  
  https://www.figma.com/downloads/
- **A Figma account** with access to your files

## Step-by-Step Setup

### Step 1 – Sign In to GitHub

1. Open VS Code
2. Click the account icon (bottom-left corner)
3. Click **Sign in with GitHub**
4. Complete authentication
5. Make sure Copilot is enabled (icon visible in status bar)
6. Engineering must grant you Copilot access.

### Step 2 – Open This Project

1. In VS Code → File → Open Folder
2. Select the `mcp-prototyping` folder

### Step 3 – Clone kununu/ui and Start Storybook

Storybook must run so Copilot can query available components.

Open the VS Code Terminal:

View → Terminal

Install your app dependencies:
```bash
cd your-app
pnpm install
cd ..
```

Clone kununu/ui:
```bash
cd ..
git clone https://github.com/kununu/ui.git
```

Start Storybook:
```bash
cd ui
npm install
npm start
```

Storybook will open at:

http://localhost:3000

⚠️ **Keep this running at all times.**  
Open a new terminal tab for other commands.

### Step 4 – Set Up MCP Connections

This connects Figma + Storybook to Copilot.

Ensure:

- Figma Desktop is running
- Storybook is running at http://localhost:3000

Open VS Code Command Palette:

- Mac: Cmd + Shift + P
- Windows: Ctrl + Shift + P

Open:

Preferences: Open User Settings (JSON)

Add:

```json
{
  "github.copilot.chat.mcp.servers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"]
    },
    "storybook": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-storybook", "http://localhost:3000"]
    }
  }
}
```

Save

Restart VS Code

If Storybook stops, you must restart it.

### Step 5 – Verify MCP Is Working

Open Copilot Chat in VS Code.

Ask:

    @workspace what MCP servers are available?

You should see:

- figma
- storybook

Then ask:

    What UI components are available in Storybook?

If it responds correctly → you’re ready.

## Recreate a Figma Design

### Step 1 – Open Your Design

1. Open Figma Desktop
2. Open the file you want to build
3. Select the frame
4. Keep Figma open

### Step 2 – Ask Copilot to Build It

Open:

    /your-app/app/page.tsx

Then use this prompt:

    Recreate the Figma Frame I have selected in Figma Desktop. *Describe the desired behavior as accurately as possible*.
    
    Follow COPILOT_INSTRUCTIONS.md.
    
    Specifically:
    - Query Storybook first
    - Use @kununu/ui components
    - Match exact layout and spacing
    - Use typography classes
    - Use design tokens for colors and spacing

Copilot will:

- Query Storybook
- Analyze your Figma structure
- Map sections to real components
- Create folders
- Generate full implementation

Review the code after generation.

## Recommended Workflow

### 1. Build the Entire Page First

Always start by generating the full page.

It is:

- Faster
- More reliable
- Better component mapping

### 2. Then Iterate Through Conversation

Examples:

- “Move the carousel down 80px.”
- “Increase hero padding-top to 120px.”
- “Change primary button to coral.”
- “Use h2-medium instead of h2-semibold.”
- “Make the header sticky.”

Make small, clear changes.

## Vibe Coding Guidelines (Very Important)

Vibe coding means:

You describe exactly what you want. Copilot writes the code.

Copilot is literal.  
Be specific.

### Be Specific About Layout

❌ Bad:

    Fix spacing.

✅ Good:

    Add 64px spacing between hero and carousel.
    Center the CTA button horizontally.
    Limit content width to 1200px.

### One Change at a Time

❌ Bad:

    Fix hero, button, spacing, and typography.

✅ Good:

    1. Reduce hero padding-bottom to 40px.
    2. Change button color to coral.
    3. Increase headline font size slightly.

### Always Reference the Guidelines

Include:

    Follow COPILOT_INSTRUCTIONS.md

This ensures:

- Correct folder structure
- Correct tokens
- Correct typography
- Correct component usage

### Ask Copilot Questions

You can ask:

- “What components are available?”
- “What props does the Button support?”
- “Which component should we use here?”

## Running Your App

Open terminal:

```bash
cd your-app
pnpm dev
```

Wait for:

    Ready on http://localhost:3000

Open:

    http://localhost:3000

Changes auto-refresh.

Stop server with:

    Ctrl + C

## Troubleshooting

### Figma Not Connecting?

- Make sure Desktop app is running
- Restart VS Code
- Check you’re logged in

### Copilot Not Using Components?

Ask:

    Query Storybook first and use @kununu/ui components only.

### Errors in Browser?

- Screenshot the error
- Paste into Copilot
- Ask:

      I’m getting this error. Please fix it.

Bug fixing is normal.

## Typography & Fonts

Fonts are stored locally because the kununu CDN blocks localhost.

Located in:

    your-app/public/fonts/

Typography classes:

**Headings:**

    .h1
    .h2
    .h3-semibold
    .h3-medium
    .h4-semibold
    .h4-medium
    .h5
    .h6

**Paragraphs:**

    .p-base-regular
    .p-base-semibold
    .p-base-bold
    .p-small-regular
    .p-tiny-regular

**UI:**

    .legend-regular
    .helper-regular
    .button
    .chip

Always use typography classes instead of custom styles.


## What To Remember

- Keep Figma Desktop open
- Keep Storybook running
- Always reference COPILOT_INSTRUCTIONS.md
- Be extremely specific
- Iterate in small steps
