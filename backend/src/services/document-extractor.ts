import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";

export interface ExtractedText {
  text: string;
  pageCount?: number;
}

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<ExtractedText> {
  if (mimeType === "text/plain" || path.extname(filePath).toLowerCase() === ".txt") {
    const buffer = await fs.readFile(filePath, "utf-8");
    const text = buffer.replace(/\0/g, "").trim();
    return { text, pageCount: undefined };
  }

  if (mimeType === "application/pdf" || path.extname(filePath).toLowerCase() === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return { text: (data.text || "").trim(), pageCount: data.numpages };
  }

  throw new Error(`Unsupported file type for extraction: ${mimeType}`);
}
