// backend/lib/extract.js
import mammoth from "mammoth";
import { parse } from "csv-parse/sync";

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractDocument(file) {
  const name = file.originalname || "";
  const ext = name.split(".").pop()?.toLowerCase();

  // --------------------
  // PDF (pdfjs-dist)
  // --------------------
 if (ext === "pdf" || file.mimetype === "application/pdf") {
  // ✅ convert Buffer -> Uint8Array
  const uint8 = new Uint8Array(file.buffer);

  const loadingTask = pdfjs.getDocument({
    data: uint8,
    disableWorker: true,
  });

  const doc = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join(" ");
    fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
  }

  return {
    kind: "pdf",
    extractedText: fullText,
    meta: { pages: doc.numPages },
  };
}

  // --------------------
  // DOCX
  // --------------------
  if (
    ext === "docx" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return { kind: "docx", extractedText: result.value || "", meta: {} };
  }

  // --------------------
  // CSV
  // --------------------
  if (ext === "csv" || file.mimetype === "text/csv") {
    const csvText = file.buffer.toString("utf8");
    const records = parse(csvText, { columns: true, skip_empty_lines: true });
    return {
      kind: "csv",
      extractedText: csvText,
      meta: {
        headers: records[0] ? Object.keys(records[0]) : [],
        sampleRows: records.slice(0, 50),
        rowCount: records.length,
      },
    };
  }

  // --------------------
  // TXT / fallback
  // --------------------
  const text = file.buffer.toString("utf8");
  return { kind: ext || "text", extractedText: text, meta: {} };
}
