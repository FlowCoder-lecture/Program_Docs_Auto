#!/usr/bin/env node
/**
 * High-Quality Markdown to DOCX Converter
 *
 * Features:
 * - Complete markdown parsing with marked.js
 * - Professional Korean business document styling
 * - Full support for tables, images, lists, and formatting
 * - Customizable styles and fonts
 *
 * Usage: node md-to-docx.js <input.md> <output.docx> [--images-dir=./images]
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, PageNumber, LevelFormat, ShadingType, VerticalAlign,
  TableOfContents, PageBreak, convertInchesToTwip
} = require('docx');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  fonts: {
    heading: 'Malgun Gothic',  // 맑은 고딕
    body: 'Malgun Gothic',
    fallback: 'Arial'
  },
  sizes: {
    title: 36,      // 18pt
    h1: 32,         // 16pt
    h2: 28,         // 14pt
    h3: 24,         // 12pt
    h4: 22,         // 11pt
    body: 22,       // 11pt
    small: 20       // 10pt
  },
  colors: {
    heading: '1F4E79',  // Dark blue
    body: '333333',
    tableHeader: 'D6E9F8',
    tableBorder: 'BFBFBF',
    link: '0563C1'
  },
  spacing: {
    beforeH1: 400,
    afterH1: 200,
    beforeH2: 300,
    afterH2: 150,
    beforeH3: 200,
    afterH3: 100,
    afterParagraph: 120,
    lineSpacing: 276  // 1.15 line spacing
  },
  page: {
    marginTop: convertInchesToTwip(1),
    marginBottom: convertInchesToTwip(1),
    marginLeft: convertInchesToTwip(1),
    marginRight: convertInchesToTwip(1)
  }
};

// ============================================================================
// Markdown Parser Setup
// ============================================================================

class DocxRenderer {
  constructor(imagesDir) {
    this.imagesDir = imagesDir;
    this.children = [];
    this.currentListType = null;
    this.listItemCount = 0;
    this.numbering = this.createNumberingConfig();
  }

  createNumberingConfig() {
    return {
      config: [
        {
          reference: 'bullet-list',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'numbered-list',
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'checkbox-list',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '☐',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    };
  }

  // Parse inline formatting (bold, italic, links, etc.)
  parseInlineContent(text) {
    if (!text) return [new TextRun({ text: '', font: CONFIG.fonts.body })];

    const runs = [];
    let remaining = text;

    // Process inline elements
    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, style: { bold: true, italics: true } },
      { regex: /\*\*(.+?)\*\*/g, style: { bold: true } },
      { regex: /\*(.+?)\*/g, style: { italics: true } },
      { regex: /__(.+?)__/g, style: { bold: true } },
      { regex: /_(.+?)_/g, style: { italics: true } },
      { regex: /`(.+?)`/g, style: { font: 'Consolas', shading: { fill: 'F0F0F0' } } },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, style: { color: CONFIG.colors.link, underline: {} } }
    ];

    // Simple approach: process text sequentially
    let processedText = text;

    // Handle images in inline content - replace with warning (images not supported in tables)
    processedText = processedText.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match, alt) => {
      console.warn(`⚠️  표 안의 이미지 감지: "${alt || '이미지'}" - 표 외부로 이동 권장`);
      return `[이미지: ${alt || '이미지'}]`;
    });

    // Handle bold
    processedText = processedText.replace(/\*\*(.+?)\*\*/g, '{{BOLD:$1}}');
    // Handle italic
    processedText = processedText.replace(/\*(.+?)\*/g, '{{ITALIC:$1}}');
    // Handle inline code
    processedText = processedText.replace(/`([^`]+)`/g, '{{CODE:$1}}');
    // Handle links - extract text only
    processedText = processedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Split and create runs
    const parts = processedText.split(/({{[A-Z]+:[^}]+}})/);

    for (const part of parts) {
      if (!part) continue;

      const boldMatch = part.match(/{{BOLD:(.+)}}/);
      const italicMatch = part.match(/{{ITALIC:(.+)}}/);
      const codeMatch = part.match(/{{CODE:(.+)}}/);

      if (boldMatch) {
        runs.push(new TextRun({
          text: boldMatch[1],
          bold: true,
          font: CONFIG.fonts.body,
          size: CONFIG.sizes.body,
          color: CONFIG.colors.body
        }));
      } else if (italicMatch) {
        runs.push(new TextRun({
          text: italicMatch[1],
          italics: true,
          font: CONFIG.fonts.body,
          size: CONFIG.sizes.body,
          color: CONFIG.colors.body
        }));
      } else if (codeMatch) {
        runs.push(new TextRun({
          text: codeMatch[1],
          font: 'Consolas',
          size: CONFIG.sizes.body - 2,
          shading: { fill: 'F5F5F5', type: ShadingType.CLEAR }
        }));
      } else {
        runs.push(new TextRun({
          text: part,
          font: CONFIG.fonts.body,
          size: CONFIG.sizes.body,
          color: CONFIG.colors.body
        }));
      }
    }

    return runs.length > 0 ? runs : [new TextRun({ text: '', font: CONFIG.fonts.body })];
  }

  // Create heading paragraph
  createHeading(text, level) {
    const cleanText = text.replace(/^#+\s*/, '').trim();
    const sizes = [CONFIG.sizes.title, CONFIG.sizes.h1, CONFIG.sizes.h2, CONFIG.sizes.h3, CONFIG.sizes.h4];
    const headingLevels = [HeadingLevel.TITLE, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2,
                          HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];

    const idx = Math.min(level, 4);
    const spacingBefore = [500, 400, 300, 200, 150][idx];
    const spacingAfter = [250, 200, 150, 100, 80][idx];

    return new Paragraph({
      heading: headingLevels[idx],
      spacing: { before: spacingBefore, after: spacingAfter },
      children: [
        new TextRun({
          text: cleanText,
          bold: true,
          font: CONFIG.fonts.heading,
          size: sizes[idx],
          color: CONFIG.colors.heading
        })
      ]
    });
  }

  // Create paragraph
  createParagraph(text, options = {}) {
    const runs = this.parseInlineContent(text);
    return new Paragraph({
      spacing: { after: CONFIG.spacing.afterParagraph, line: CONFIG.spacing.lineSpacing },
      alignment: options.alignment || AlignmentType.JUSTIFIED,
      children: runs,
      ...options
    });
  }

  // Create table from markdown table data
  createTable(rows) {
    if (!rows || rows.length === 0) return null;

    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: CONFIG.colors.tableBorder };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    // Calculate column count from first row
    const colCount = rows[0].length;
    const totalWidth = 9360; // Letter size minus margins in DXA
    const colWidth = Math.floor(totalWidth / colCount);
    const columnWidths = Array(colCount).fill(colWidth);

    const tableRows = rows.map((row, rowIndex) => {
      const isHeader = rowIndex === 0;

      const cells = row.map((cellText, colIndex) => {
        const text = (cellText || '').toString().trim();
        const runs = this.parseInlineContent(text);

        return new TableCell({
          borders: cellBorders,
          width: { size: columnWidths[colIndex], type: WidthType.DXA },
          shading: isHeader ? { fill: CONFIG.colors.tableHeader, type: ShadingType.CLEAR } : undefined,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: isHeader ? [
                new TextRun({
                  text: text,
                  bold: true,
                  font: CONFIG.fonts.body,
                  size: CONFIG.sizes.body,
                  color: CONFIG.colors.body
                })
              ] : runs
            })
          ]
        });
      });

      return new TableRow({
        tableHeader: isHeader,
        children: cells
      });
    });

    return new Table({
      columnWidths: columnWidths,
      rows: tableRows
    });
  }

  // Create list item
  createListItem(text, isOrdered = false, isChecked = null) {
    const runs = this.parseInlineContent(text);

    let reference = isOrdered ? 'numbered-list' : 'bullet-list';

    // Handle checkbox items
    if (isChecked !== null) {
      const checkbox = isChecked ? '☑ ' : '☐ ';
      runs.unshift(new TextRun({
        text: checkbox,
        font: CONFIG.fonts.body,
        size: CONFIG.sizes.body
      }));
      reference = 'bullet-list';
    }

    return new Paragraph({
      numbering: { reference, level: 0 },
      spacing: { after: 60 },
      children: runs
    });
  }

  // Create image
  createImage(src, alt) {
    // Resolve image path
    let imagePath = src;
    if (!path.isAbsolute(src)) {
      imagePath = path.resolve(this.imagesDir, path.basename(src));
      // Also try the src path directly
      if (!fs.existsSync(imagePath)) {
        imagePath = path.resolve(path.dirname(this.imagesDir), src);
      }
      if (!fs.existsSync(imagePath)) {
        imagePath = src;
      }
    }

    if (!fs.existsSync(imagePath)) {
      console.warn(`Image not found: ${imagePath}`);
      return new Paragraph({
        children: [new TextRun({ text: `[Image: ${alt || src}]`, italics: true })]
      });
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const ext = path.extname(imagePath).toLowerCase().replace('.', '');
      const imageType = ext === 'jpg' ? 'jpeg' : ext;

      // Default image size (can be adjusted based on actual image dimensions)
      const width = 500;
      const height = 350;

      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
          new ImageRun({
            type: imageType,
            data: imageBuffer,
            transformation: { width, height },
            altText: { title: alt || '', description: alt || '', name: alt || 'image' }
          })
        ]
      });
    } catch (error) {
      console.error(`Error loading image ${imagePath}:`, error.message);
      return new Paragraph({
        children: [new TextRun({ text: `[Image Error: ${alt || src}]`, italics: true })]
      });
    }
  }

  // Create horizontal rule
  createHorizontalRule() {
    return new Paragraph({
      spacing: { before: 200, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' }
      },
      children: []
    });
  }

  // Create blockquote
  createBlockquote(text) {
    const runs = this.parseInlineContent(text);
    return new Paragraph({
      indent: { left: 720 },
      spacing: { before: 100, after: 100 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 24, color: CONFIG.colors.heading }
      },
      shading: { fill: 'F9F9F9', type: ShadingType.CLEAR },
      children: runs
    });
  }

  // Create code block
  createCodeBlock(code, language) {
    const lines = code.split('\n');
    const paragraphs = lines.map(line =>
      new Paragraph({
        spacing: { after: 0 },
        shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
        children: [
          new TextRun({
            text: line || ' ',
            font: 'Consolas',
            size: CONFIG.sizes.small
          })
        ]
      })
    );
    return paragraphs;
  }
}

// ============================================================================
// Main Conversion Function
// ============================================================================

async function convertMarkdownToDocx(inputPath, outputPath, imagesDir) {
  console.log(`Converting: ${inputPath} -> ${outputPath}`);
  console.log(`Images directory: ${imagesDir}`);

  // Read markdown file
  const markdown = fs.readFileSync(inputPath, 'utf-8');

  // Initialize renderer
  const renderer = new DocxRenderer(imagesDir);

  // Parse markdown line by line for better control
  const lines = markdown.split('\n');
  let i = 0;
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let inTable = false;
  let tableRows = [];

  while (i < lines.length) {
    const line = lines[i];

    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block - skip mermaid blocks
        if (codeBlockLang !== 'mermaid') {
          const codeParas = renderer.createCodeBlock(codeBlockContent.join('\n'), codeBlockLang);
          renderer.children.push(...codeParas);
        }
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      i++;
      continue;
    }

    // Table handling
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Check if it's a separator line
      if (line.match(/^\|[\s\-:|]+\|$/)) {
        i++;
        continue;
      }

      // Parse table row
      const cells = line.split('|').slice(1, -1).map(c => c.trim());

      // Check if column count changed (new table detected)
      if (tableRows.length > 0 && cells.length !== tableRows[0].length) {
        // Close current table first
        const table = renderer.createTable(tableRows);
        if (table) {
          renderer.children.push(table);
          renderer.children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
          console.log(`📊 표 분리 감지: ${tableRows[0].length}열 → ${cells.length}열 (자동 분리됨)`);
        }
        tableRows = [];
      }

      tableRows.push(cells);

      // Check if next line is still table
      const nextLine = lines[i + 1] || '';
      const isNextLineTable = nextLine.includes('|') && nextLine.trim().startsWith('|');
      const isNextLineSeparator = nextLine.match(/^\|[\s\-:|]+\|$/);

      if (!isNextLineTable) {
        // End of table
        if (tableRows.length > 0) {
          const table = renderer.createTable(tableRows);
          if (table) {
            renderer.children.push(table);
            renderer.children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
          }
        }
        tableRows = [];
      } else if (isNextLineSeparator) {
        // Next line is a separator - check if it starts a new table
        const lineAfterSeparator = lines[i + 2] || '';
        if (lineAfterSeparator.includes('|') && lineAfterSeparator.trim().startsWith('|')) {
          const nextCells = lineAfterSeparator.split('|').slice(1, -1).map(c => c.trim());
          if (nextCells.length !== cells.length) {
            // Different column count - close current table
            if (tableRows.length > 0) {
              const table = renderer.createTable(tableRows);
              if (table) {
                renderer.children.push(table);
                renderer.children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
                console.log(`📊 표 분리 감지 (구분선 후): ${cells.length}열 → ${nextCells.length}열`);
              }
            }
            tableRows = [];
          }
        }
      }
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      renderer.children.push(renderer.createHorizontalRule());
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      renderer.children.push(renderer.createHeading(text, level));
      i++;
      continue;
    }

    // Images
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      const alt = imageMatch[1];
      const src = imageMatch[2];
      renderer.children.push(renderer.createImage(src, alt));

      // Check for caption on next line
      const nextLine = lines[i + 1] || '';
      if (nextLine.match(/^[<\|]/)) {
        // Skip caption line, it will be handled separately
      }
      i++;
      continue;
    }

    // Lists
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    const checkboxMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);

    if (checkboxMatch) {
      const isChecked = checkboxMatch[2].toLowerCase() === 'x';
      renderer.children.push(renderer.createListItem(checkboxMatch[3], false, isChecked));
      i++;
      continue;
    }

    if (bulletMatch) {
      renderer.children.push(renderer.createListItem(bulletMatch[2], false));
      i++;
      continue;
    }

    if (numberedMatch) {
      renderer.children.push(renderer.createListItem(numberedMatch[2], true));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      renderer.children.push(renderer.createBlockquote(text));
      i++;
      continue;
    }

    // Regular paragraph
    renderer.children.push(renderer.createParagraph(line));
    i++;
  }

  // Create document with styles
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: CONFIG.fonts.body,
            size: CONFIG.sizes.body
          }
        }
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          run: { size: CONFIG.sizes.title, bold: true, color: CONFIG.colors.heading, font: CONFIG.fonts.heading },
          paragraph: { spacing: { before: 0, after: 250 }, alignment: AlignmentType.CENTER }
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: CONFIG.sizes.h1, bold: true, color: CONFIG.colors.heading, font: CONFIG.fonts.heading },
          paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: CONFIG.sizes.h2, bold: true, color: CONFIG.colors.heading, font: CONFIG.fonts.heading },
          paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: CONFIG.sizes.h3, bold: true, color: CONFIG.colors.heading, font: CONFIG.fonts.heading },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
        }
      ]
    },
    numbering: renderer.numbering,
    sections: [{
      properties: {
        page: {
          margin: {
            top: CONFIG.page.marginTop,
            bottom: CONFIG.page.marginBottom,
            left: CONFIG.page.marginLeft,
            right: CONFIG.page.marginRight
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: '사업계획서',
                  font: CONFIG.fonts.body,
                  size: CONFIG.sizes.small,
                  color: '888888'
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: CONFIG.fonts.body,
                  size: CONFIG.sizes.small
                }),
                new TextRun({
                  text: ' / ',
                  font: CONFIG.fonts.body,
                  size: CONFIG.sizes.small
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: CONFIG.fonts.body,
                  size: CONFIG.sizes.small
                })
              ]
            })
          ]
        })
      },
      children: renderer.children
    }]
  });

  // Write document
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log(`Successfully created: ${outputPath}`);
  console.log(`Total elements: ${renderer.children.length}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node md-to-docx.js <input.md> <output.docx> [--images-dir=./images]');
    console.log('');
    console.log('Options:');
    console.log('  --images-dir=PATH    Directory containing images (default: same as input file)');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  // Parse images dir option
  let imagesDir = path.dirname(inputPath);
  for (const arg of args.slice(2)) {
    if (arg.startsWith('--images-dir=')) {
      imagesDir = arg.split('=')[1];
    }
  }

  // Make paths absolute
  const absInputPath = path.resolve(inputPath);
  const absOutputPath = path.resolve(outputPath);
  const absImagesDir = path.resolve(imagesDir);

  convertMarkdownToDocx(absInputPath, absOutputPath, absImagesDir)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { convertMarkdownToDocx };
