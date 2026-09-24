declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; name?: string; email?: string };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name?: string; email?: string };
    }
    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
      };
    }
  }
}
