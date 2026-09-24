import path from "path";
import fs from "fs";
import multer, { FileFilter } from "multer";
import { env } from "../config/env";
import { Request } from "express";

export interface MulterFile extends Express.Multer.File {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/octet-stream",
]);

const fileFilter: FileFilter = (_req: Request, file: Express.Multer.File, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === "application/pdf" || file.mimetype === "text/plain" || ext === ".pdf" || ext === ".txt") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and TXT files are allowed."), true);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_SIZE },
  fileFilter,
});
