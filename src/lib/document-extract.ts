/**
 * Browser-side document text extraction.
 *
 * Supported MIME / extensions:
 *   - text/plain, .txt, .md         → read as text
 *   - application/pdf, .pdf         → parsed via pdfjs-dist
 *   - .docx                         → parsed via mammoth
 *   - .pptx                         → basic text extraction via JSZip (best effort)
 */

export interface ExtractResult {
  text: string;
  pages?: number;
  warning?: string;
}

const MAX_CHARS = 60_000; // Cap what we send to the LLM

function truncate(text: string): { text: string; warning?: string } {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_CHARS) return { text: trimmed };
  return {
    text: trimmed.slice(0, MAX_CHARS),
    warning: `Document was trimmed to the first ${MAX_CHARS.toLocaleString()} characters.`,
  };
}

export async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const type = file.type;

  // Plain text / markdown
  if (
    type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".markdown")
  ) {
    const text = await file.text();
    return truncate(text);
  }

  // PDF
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdf(file);
  }

  // DOCX
  if (
    name.endsWith(".docx") ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocx(file);
  }

  // PPTX
  if (
    name.endsWith(".pptx") ||
    type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return extractPptx(file);
  }

  throw new Error(
    `Unsupported file type: ${file.name}. Supported: .pdf, .docx, .pptx, .txt, .md`,
  );
}

async function extractDocx(file: File): Promise<ExtractResult> {
  // mammoth is already a runtime dependency; lazy-load to keep landing bundle small
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const { value, messages } = await mammoth.extractRawText({ arrayBuffer: buf });
  const { text, warning } = truncate(value);
  const mammothWarn = messages
    ?.filter((m: { type?: string }) => m.type === "warning")
    ?.slice(0, 3)
    ?.map((m: { message?: string }) => m.message)
    ?.join("; ");
  return {
    text,
    warning: [warning, mammothWarn].filter(Boolean).join(" "),
  };
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs = (await import("pdfjs-dist")) as typeof import("pdfjs-dist");
  // Configure worker — uses the ESM worker from the same package
  try {
    const workerUrl = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
      workerUrl;
  } catch {
    // Fall back to no-worker mode; pdfjs will run on main thread
  }

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ");
    parts.push(pageText);
    if (parts.join("\n\n").length > MAX_CHARS) break;
  }
  const { text, warning } = truncate(parts.join("\n\n"));
  return { text, pages: doc.numPages, warning };
}

async function extractPptx(file: File): Promise<ExtractResult> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] ?? "0", 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] ?? "0", 10);
      return na - nb;
    });

  const slideTexts: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    // Extract text between <a:t>...</a:t> elements. Crude but effective.
    const chunks = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    if (chunks.length) {
      slideTexts.push(
        `Slide ${slideTexts.length + 1}:\n${chunks.join("\n")}`,
      );
    }
  }

  if (slideTexts.length === 0) {
    return {
      text: "",
      warning:
        "We couldn't pull any text from this .pptx. It may be image-only or use an unusual format — try uploading as .pdf or pasting the key text.",
    };
  }

  const { text, warning } = truncate(slideTexts.join("\n\n"));
  return {
    text,
    pages: slideTexts.length,
    warning,
  };
}
