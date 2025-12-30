---
name: mark-docx
description: "High-quality Markdown to DOCX conversion with professional Korean business document styling. Also supports document editing, tracked changes, and analysis. Primary use: Converting business plans (사업계획서), reports, and proposals from Markdown to beautifully formatted Word documents."
license: Proprietary. LICENSE.txt has complete terms
---

# mark-docx: Markdown to DOCX Conversion

## Overview

This skill provides high-quality conversion from Markdown to professional Word documents, optimized for Korean business documents like 사업계획서 (business plans), proposals, and reports.

## Primary Workflow: Markdown to DOCX (Recommended)

Use `md-to-docx.js` for converting Markdown files to professionally styled DOCX:

```bash
node .claude/skills/mark-docx/scripts/md-to-docx.js <input.md> <output.docx> [--images-dir=./images]
```

### Features
- **Professional Korean Typography**: 맑은 고딕 (Malgun Gothic) font optimized for Korean text
- **Automatic Image Embedding**: Images referenced in Markdown are embedded in DOCX
- **Full Markdown Support**: Headings, tables, lists, bold, italic, checkboxes, images
- **Business Document Styling**: Proper heading hierarchy, spacing, colors
- **Headers & Footers**: Page numbers and document title
- **Table Formatting**: Styled headers, borders, cell padding

### ⚠️ Important: Images in Tables
**Images inside table cells are NOT supported.** If you have images in tables, move them outside:

```markdown
❌ BAD - Image in table:
| | |
|---|---|
| ![image](path.png) | text |

✅ GOOD - Image outside table:
**< Caption >**
![image](path.png)
```

The script will detect images in table cells and replace them with `[이미지: alt text]` placeholder.

### Example Usage
```bash
# Convert business plan with images
node .claude/skills/mark-docx/scripts/md-to-docx.js \
  사업계획서.md \
  사업계획서.docx \
  --images-dir=./images
```

### Style Configuration
The script uses professional business document styling:
- **Fonts**: Malgun Gothic (맑은 고딕) for headings and body
- **Heading Colors**: Dark blue (#1F4E79)
- **Table Headers**: Light blue background (#D6E9F8)
- **Page Margins**: 1 inch all sides
- **Line Spacing**: 1.15

### Pre-processing Markdown
Before conversion, clean up reference sections that shouldn't appear in final document:

```bash
# Remove Mermaid source code and image generation guidelines
awk '
  /^## Mermaid 다이어그램/ { skip=1 }
  /^## 이미지 생성 가이드라인/ { skip=1 }
  /^## 증빙서류 목록/ { skip=0 }
  !skip { print }
' input.md > clean.md
```

---

## Alternative Workflows

### Quick Conversion with Pandoc
For simpler documents or when custom styling isn't needed:

```bash
# Basic conversion
pandoc input.md -o output.docx

# With reference template for styling
pandoc input.md -o output.docx --reference-doc=template.docx
```

### Creating Custom Documents from Scratch
When you need complete control over every element, use **docx-js** directly.

**Workflow:**
1. **MANDATORY - READ ENTIRE FILE**: Read [`docx-js.md`](docx-js.md) for detailed syntax and best practices
2. Create a JavaScript/TypeScript file using Document, Paragraph, TextRun components
3. Export as .docx using Packer.toBuffer()

### Editing Existing Documents
For modifying existing .docx files (tracked changes, comments, etc.):

**Workflow:**
1. **MANDATORY - READ ENTIRE FILE**: Read [`ooxml.md`](ooxml.md) for the Document library API
2. Unpack: `python ooxml/scripts/unpack.py <office_file> <output_directory>`
3. Create and run a Python script using the Document library
4. Pack: `python ooxml/scripts/pack.py <input_directory> <office_file>`

---

## Reading and Analyzing Content

### Text Extraction
```bash
# Convert document to markdown with tracked changes
pandoc --track-changes=all path-to-file.docx -o output.md
```

### Raw XML Access
For comments, complex formatting, embedded media:
```bash
python ooxml/scripts/unpack.py <office_file> <output_directory>
```

Key file structures:
- `word/document.xml` - Main document contents
- `word/comments.xml` - Comments
- `word/media/` - Embedded images and media

---

## Converting Documents to Images

```bash
# Step 1: DOCX to PDF
soffice --headless --convert-to pdf document.docx

# Step 2: PDF to images
pdftoppm -jpeg -r 150 document.pdf page
```

---

## Dependencies

Required dependencies:
- **Node.js packages** (in scripts folder):
  - `marked` - Markdown parsing
  - `docx` - DOCX generation

Install with:
```bash
cd .claude/skills/mark-docx/scripts && npm install
```

Optional tools:
- **pandoc**: For quick conversions and text extraction
- **LibreOffice**: For PDF conversion (`soffice`)
- **Poppler**: For PDF to image conversion (`pdftoppm`)
