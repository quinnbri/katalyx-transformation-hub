/**
 * Convert a markdown string into a downloadable .docx file.
 *
 * This is intentionally minimal — we support the subset of markdown the
 * advisor actually emits: headings (#, ##, ###), bullet lists (-, *),
 * numbered lists (1., 2.), bold (**text**), italic (*text*), inline code
 * (`code`), and paragraphs. Tables, links, and images are flattened to
 * plain text rather than failing the export.
 *
 * The `docx` package is lazy-loaded so it doesn't land in the main bundle.
 */

export interface GenerateDocxOptions {
  title: string;
  markdown: string;
  /** e.g. "KATALYX Strategy" — rendered as a subtitle under the title */
  subtitle?: string;
}

export async function downloadMarkdownAsDocx(
  options: GenerateDocxOptions,
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    TextRun,
    AlignmentType,
  } = await import("docx");

  const { title, subtitle, markdown } = options;

  const children: InstanceType<typeof Paragraph>[] = [];

  // Cover block
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({ text: title, bold: true, size: 40 }),
      ],
    }),
  );
  if (subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: subtitle,
            italics: true,
            size: 22,
            color: "555555",
          }),
        ],
      }),
    );
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated ${new Date().toLocaleDateString()}`,
          size: 18,
          color: "888888",
        }),
      ],
    }),
  );
  children.push(new Paragraph({ text: "" })); // spacer

  // Parse markdown line by line
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;
  const codeLines: string[] = [];

  const flushCode = () => {
    if (codeLines.length) {
      children.push(
        new Paragraph({
          children: codeLines.map(
            (line) =>
              new TextRun({
                text: line + "\n",
                font: "Consolas",
                size: 20,
              }),
          ),
          shading: { type: "clear", color: "auto", fill: "F5F5F5" },
        } as unknown as ConstructorParameters<typeof Paragraph>[0]),
      );
      codeLines.length = 0;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "    ");

    // Fenced code blocks
    if (/^```/.test(line)) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Blank line → paragraph break
    if (line.trim() === "") {
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length, 4);
      const headingLevel =
        level === 1
          ? HeadingLevel.HEADING_1
          : level === 2
            ? HeadingLevel.HEADING_2
            : level === 3
              ? HeadingLevel.HEADING_3
              : HeadingLevel.HEADING_4;
      children.push(
        new Paragraph({
          heading: headingLevel,
          children: parseInline(h[2], TextRun),
        }),
      );
      continue;
    }

    // Bullet list item
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    if (bullet) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInline(bullet[1], TextRun),
        }),
      );
      continue;
    }

    // Numbered list item
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numbered) {
      children.push(
        new Paragraph({
          numbering: { reference: "default-numbering", level: 0 },
          children: parseInline(numbered[1], TextRun),
        }),
      );
      continue;
    }

    // Blockquote
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({
              text: quote[1],
              italics: true,
              color: "555555",
            }),
          ],
        }),
      );
      continue;
    }

    // Horizontal rule
    if (/^\s*(?:---|___|\*\*\*)\s*$/.test(line)) {
      children.push(
        new Paragraph({
          border: {
            bottom: { color: "999999", size: 6, style: "single", space: 1 },
          },
        } as unknown as ConstructorParameters<typeof Paragraph>[0]),
      );
      continue;
    }

    // Default paragraph
    children.push(
      new Paragraph({
        children: parseInline(line, TextRun),
      }),
    );
  }
  flushCode();

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(title)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parse a single line of markdown-ish inline text into TextRun[] with
 * bold / italic / code styling. Keeps the parser tiny and predictable.
 */
function parseInline(
  text: string,
  TextRun: typeof import("docx").TextRun,
): InstanceType<typeof import("docx").TextRun>[] {
  // Tokenize by ``, **, *, without full markdown grammar.
  // Order matters: backticks first, then bold, then italic.
  const runs: InstanceType<typeof TextRun>[] = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, m.index) }));
    }
    if (m[1]) {
      runs.push(
        new TextRun({
          text: m[1].slice(1, -1),
          font: "Consolas",
          size: 20,
        }),
      );
    } else if (m[2]) {
      runs.push(new TextRun({ text: m[2].slice(2, -2), bold: true }));
    } else if (m[3]) {
      runs.push(new TextRun({ text: m[3].slice(1, -1), italics: true }));
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }
  return runs;
}

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "_")
      .slice(0, 80) || "katalyx-strategy"
  );
}
