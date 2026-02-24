# React Email Editor - User Guide

A complete guide to designing email templates with the drag-and-drop editor.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Editor Layout](#editor-layout)
- [Working with Text](#working-with-text)
- [Blocks](#blocks)
- [Sections & Columns](#sections--columns)
- [Variables](#variables)
- [Properties Panel](#properties-panel)
- [Toolbar & Tabs](#toolbar--tabs)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Drag & Drop](#drag--drop)
- [Image Upload](#image-upload)
- [Import & Export](#import--export)
- [Tips & Edge Cases](#tips--edge-cases)

---

## Getting Started

The editor opens in **Visual** mode with three main areas:

| Area | Position | Purpose |
|------|----------|---------|
| **Sidebar** | Left | Add blocks, layouts, and variables |
| **Canvas** | Center | Design your email visually |
| **Properties** | Right | Edit the selected block's settings |

Click any block on the canvas to select it and reveal its properties on the right.

---

## Editor Layout

### Tabs

The editor has three tabs accessible from the toolbar:

- **Visual** - The main drag-and-drop design canvas
- **Source** - View and edit the raw MJML code directly
- **Preview** - See the final rendered email (Desktop or Mobile width)

---

## Working with Text

### Enter vs Shift+Enter

This is the most important thing to understand:

| Key | What it does | HTML produced |
|-----|-------------|---------------|
| **Enter** | Creates a **new paragraph** | `<p>new paragraph</p>` |
| **Shift+Enter** | Creates a **line break** within the same paragraph | `<br>` |

**Why does this matter?**

- Pressing **Enter** multiple times does **not** create visible vertical space between lines. Each new paragraph has zero margin, so pressing Enter twice looks the same as pressing it once — there is no blank line gap.
- To add vertical space between content, use a **Spacer block** between blocks, or adjust the **padding** on individual blocks.
- Use **Shift+Enter** when you want text on the next line within the same paragraph (e.g., an address block).

### Example

To create this:

```
John Doe
123 Main Street
New York, NY 10001
```

Type: `John Doe` → **Shift+Enter** → `123 Main Street` → **Shift+Enter** → `New York, NY 10001`

If you use **Enter** instead, each line becomes a separate paragraph — visually identical in the editor but semantically different in the HTML output.

### Rich Text Formatting

When you click into a text or heading block, a floating toolbar appears with:

| Button | Action | Shortcut |
|--------|--------|----------|
| **B** | Bold | Ctrl+B / Cmd+B |
| **I** | Italic | Ctrl+I / Cmd+I |
| **U** | Underline | Ctrl+U / Cmd+U |
| **S** | Strikethrough | Ctrl+Shift+X / Cmd+Shift+X |
| **A** | Text Color | — |
| **H** | Highlight Color | — |
| **L** | Align Left | — |
| **C** | Align Center | — |
| **R** | Align Right | — |
| **Bullet list** | Unordered list | — |
| **Numbered list** | Ordered list | — |
| **Link** | Insert/edit link | — |
| **Clear** | Remove all formatting | — |

### Font & Size

Use the **Font Family** and **Font Size** dropdowns in the floating toolbar to change the typeface and size. These apply to the selected text or, if nothing is selected, to new text typed at the cursor.

### Links

Click the **Link** button to open the link editor. Enter a URL and click **Apply**. Supported link types:
- `https://example.com` — Web links
- `mailto:name@example.com` — Email links
- `tel:+1234567890` — Phone links

To remove a link, select the linked text and click **Remove** in the link editor.

### Pasting Content

When pasting from external sources (Word, Google Docs, websites), the editor automatically cleans the content:
- Removes unnecessary styling and formatting
- Strips scripts and unsafe elements
- Keeps only email-safe HTML tags (bold, italic, links, lists, headings)
- Removes embedded images (base64) — use the Image block instead

---

## Blocks

### Available Block Types

| Block | Description | Key Properties |
|-------|-------------|----------------|
| **Text** | Rich text paragraph | Font, size, color, alignment, line height |
| **Heading** | Title text (H1–H4) | Level (H1/H2/H3/H4), font, size, color |
| **Button** | Clickable CTA button | Text, link URL, background color, border radius |
| **Image** | Picture with optional link | Source URL, alt text, link, width, fluid on mobile |
| **Divider** | Horizontal line separator | Color, width, style (solid/dashed/dotted) |
| **Spacer** | Empty vertical space | Height (5–200px via slider) |
| **Social** | Social media icon links | Platform icons, size, layout mode |
| **HTML** | Raw HTML content | Custom HTML code |
| **Video** | Video thumbnail with play link | Video URL, thumbnail (auto-generated for YouTube) |
| **Countdown** | Live countdown timer | Target date/time, colors, label |
| **Menu** | Navigation link bar | Menu items, hamburger option for mobile |
| **Hero** | Full-width hero banner | Heading, subtext, button, background image/color |

### Adding Blocks

Three ways to add a block:

1. **Drag** a block from the sidebar onto the canvas
2. **Click** a block in the sidebar to append it to the last section
3. **Press Enter or Space** with a block focused in the sidebar

### Block Actions

Hover over any block on the canvas to see action buttons:

- **Duplicate** — Creates a copy of the block directly below
- **Remove** — Deletes the block (with confirmation)

### How to Add Space Between Blocks

Since Enter does **not** create visible space, use these methods instead:

- **Spacer block** — Drag a Spacer between blocks and adjust its height (5–200px)
- **Padding** — Increase the top/bottom padding on individual blocks via the Properties panel
- **Divider block** — Use a divider with padding for a visual separator with space

---

## Sections & Columns

### What is a Section?

A **section** is a horizontal row that contains one or more **columns**. Every block lives inside a column within a section.

### Adding Sections

Use the **Layouts** tab in the sidebar to add a new section with a column configuration:

| Layout | Columns |
|--------|---------|
| 1 Column | 100% |
| 2 Columns | 50% / 50% |
| 3 Columns | 33% / 33% / 33% |
| 1/3 + 2/3 | 33% / 67% |
| 2/3 + 1/3 | 67% / 33% |

### Section Actions

Hover over a section's left edge to see action buttons:

- **Drag handle** (six dots) — Reorder sections by dragging
- **Duplicate** — Copy the entire section with all its columns and blocks
- **Remove** — Delete the section (with confirmation)

You can also use **Arrow Up / Arrow Down** keys when a section is selected to reorder it.

### Section Properties

Select a section (click its background, not a block) to edit:

- **Background Color** — Section background
- **Padding** — Internal spacing
- **Border Radius** — Rounded corners
- **Full Width** — Stretch to full email width
- **Background Image** — URL for a background image
- **Background Size** — Cover / Contain / Auto
- **Background Repeat** — No Repeat / Repeat / Repeat X / Repeat Y

---

## Variables

Variables let you insert dynamic placeholders like `{{ first_name }}` that get replaced with real data when the email is sent.

### Inserting Variables

1. **Click** a variable chip in the sidebar → inserts at the current text cursor position
2. **Drag** a variable from the sidebar into a text or heading block

Variables appear as styled chips (blue rounded tags) in the editor and are **not editable** inline — they represent a placeholder.

### Adding Custom Variables

1. Open the **Variables** section in the sidebar
2. Click the **Add Variable** area
3. Fill in:
   - **Key** (required) — The placeholder name (auto-converted to lowercase with underscores)
   - **Label** — Display name (defaults to key if empty)
   - **Group** — Category grouping (defaults to "Custom")
4. Click **Add**

Custom variables can be removed by clicking the **x** button next to them.

### Variable Format

In the generated MJML/HTML output, variables appear as: `{{ variable_key }}`

---

## Properties Panel

When a block is selected, the Properties panel on the right shows editable settings. Common controls:

### Padding

Padding controls the space around a block's content. You can set:
- **All sides at once** — Single value (e.g., `10px`)
- **Individual sides** — Top, Right, Bottom, Left separately

Click the lock/expand icon to switch between uniform and per-side padding.

### Colors

Click any color swatch to open the color picker:
- **16 preset colors** for quick selection
- **Custom hex input** for exact colors (e.g., `#ff6600`)

### Alignment

Three-button toggle: **Left**, **Center**, **Right**

### Font Settings

- **Font Family** — Dropdown with email-safe fonts
- **Font Size** — Dropdown with preset sizes (10px–48px)
- **Font Weight** — Normal or Bold
- **Text Transform** — None / Uppercase / Lowercase / Capitalize
- **Letter Spacing** — Custom spacing between characters
- **Line Height** — Vertical space between lines (e.g., 1.5)

### Global Email Settings

When **no block or section is selected**, the Properties panel shows global settings:

- **Email Title** — The `<title>` tag (appears in browser tab if email is opened in browser)
- **Preview Text** — The snippet shown in inbox previews next to the subject line
- **Background Color** — The outer background color around the email
- **Email Width** — Content width in pixels (default: 600px)
- **Font Family** — Default font for the entire email
- **Custom Styles** — Advanced CSS rules injected into the email's `<style>` block

---

## Toolbar & Tabs

### Top Toolbar

From left to right:

| Button | Action |
|--------|--------|
| **Undo** | Undo last action (Ctrl+Z / Cmd+Z) |
| **Redo** | Redo undone action (Ctrl+Shift+Z / Cmd+Shift+Z) |
| **Visual** | Switch to design canvas |
| **Source** | Switch to MJML code editor |
| **Preview** | Switch to rendered preview |
| **Import** | Import MJML/XML/TXT file |
| **Export** | Export as MJML, HTML, or PDF |

### Source Tab

The Source tab shows the raw MJML markup. You can:
- **View** the generated MJML code
- **Edit** the code directly in the textarea
- Click **Apply Changes** to parse the edited MJML back into the visual editor

A preview pane appears alongside the source code showing the rendered output.

### Preview Tab

Toggle between:
- **Desktop** (600px width) — Standard email client view
- **Mobile** (375px width) — Mobile device view

The preview updates automatically as you make changes (with a slight delay).

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+S / Cmd+S** | Save |
| **Ctrl+Z / Cmd+Z** | Undo |
| **Ctrl+Shift+Z / Cmd+Shift+Z** | Redo |
| **Ctrl+Y / Cmd+Y** | Redo (alternative) |
| **Escape** | Deselect everything |
| **Delete / Backspace** | Remove selected block or section (with confirmation) |
| **Arrow Up / Down** | Reorder selected section |

### Text Editing Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+B / Cmd+B** | Bold |
| **Ctrl+I / Cmd+I** | Italic |
| **Ctrl+U / Cmd+U** | Underline |
| **Ctrl+Shift+X / Cmd+Shift+X** | Strikethrough |
| **Enter** | New paragraph |
| **Shift+Enter** | Line break (same paragraph) |

---

## Drag & Drop

### What You Can Drag

| Item | From | To |
|------|------|----|
| **Block** (from sidebar) | Block palette | Any column on canvas |
| **Block** (on canvas) | Current position | Different position, column, or section |
| **Section** | Current position | Different position (reorder) |
| **Variable** | Variable list in sidebar | Inside a text or heading block |

### Drop Indicators

When dragging, blue indicator lines show where the item will be placed:
- **Line above a block** — Drop before that block
- **Line below a block** — Drop after that block
- **Empty column highlight** — Drop into an empty column

---

## Image Upload

### With Upload Adapter Configured

1. Select an Image or Hero block
2. Click **Upload Image** in the Properties panel
3. Select a file from your computer
4. The image uploads and the URL is set automatically

### Without Upload Adapter

Enter the image URL manually in the **Source URL** field.

### Video Thumbnails

For Video blocks, if you paste a **YouTube URL**, the editor auto-generates a thumbnail. You can also:
- Click **Auto-generate from URL** to refresh the thumbnail
- Enter a custom thumbnail URL manually

---

## Import & Export

### Import

Click **Import** in the toolbar to load an MJML file:
- Supported formats: `.mjml`, `.xml`, `.txt`
- The file contents are parsed and loaded into the editor
- This **replaces** the current template

### Export

Click **Export** and choose a format:

| Format | What You Get |
|--------|-------------|
| **MJML** | Raw MJML source code (`template.mjml`) |
| **HTML** | Compiled, email-client-ready HTML (`template.html`) |
| **PDF** | Opens print dialog — save as PDF from there |

---

## Tips & Edge Cases

### Spacing & Layout

- **Enter does not add blank space.** All paragraphs have zero margin. Use Spacer blocks or padding to create vertical gaps.
- **Shift+Enter** creates a line break (`<br>`) within the same paragraph — use this for addresses, signatures, or multi-line text within one block.
- **Padding** is the primary way to control spacing around blocks. Adjust it in the Properties panel.
- **Spacer blocks** are the best way to add precise vertical space between blocks (adjustable from 5px to 200px).

### Text Editing

- You cannot create "blank lines" by pressing Enter repeatedly. Each Enter creates a new zero-margin paragraph that stacks directly below the previous one.
- To visually separate paragraphs within a single text block, use **Shift+Enter** twice to insert two `<br>` tags, which creates a visible gap.
- **Copy-pasting** from Word or Google Docs is cleaned automatically, but complex formatting may be simplified. For best results, paste plain text and reformat in the editor.
- **Base64 images** in pasted content are stripped — use the Image block for pictures.

### Blocks & Sections

- **Clicking the canvas background** (not a block) deselects everything and shows Global Email Settings.
- **Clicking a section background** (between blocks) selects the section and shows Section Properties.
- **Deleting a section** removes all blocks inside it. Use Ctrl+Z / Cmd+Z to undo.
- **Duplicate** creates an exact copy with new internal IDs, so changes to the copy don't affect the original.

### Variables

- Variable keys are **normalized**: spaces become underscores, text becomes lowercase. `First Name` becomes `first_name`.
- Variables only render as chips inside **Text** and **Heading** blocks.
- In button text, HTML blocks, or other fields, type `{{ variable_key }}` manually.

### Preview vs Visual

- The **Visual** canvas is a close approximation of the final email, but not pixel-perfect. Always check the **Preview** tab for the true rendered result.
- **Desktop preview** (600px) represents standard email clients.
- **Mobile preview** (375px) shows how the email renders on phone screens — columns may stack vertically.

### History / Undo

- The editor keeps up to **50 undo states**.
- Undo/Redo works for all actions: adding, removing, moving, editing blocks and sections.
- After undoing, if you make a new change, the redo history is cleared.

### Links

- Only `http://`, `https://`, `mailto:`, and `tel:` links are allowed.
- `javascript:` and other protocols are blocked for security.
- If a link URL is invalid, it defaults to `#`.

### Email Clients

- The editor generates **MJML**, which compiles to responsive HTML compatible with all major email clients (Gmail, Outlook, Apple Mail, Yahoo, etc.).
- Fonts like Arial, Georgia, and Verdana are universally supported. Custom/web fonts may fall back to defaults in some clients.
- Background images on sections may not display in all email clients (notably Outlook on Windows).
