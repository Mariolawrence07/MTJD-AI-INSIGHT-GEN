// backend/middleware/upload.middleware.js
import multer from "multer";

const storage = multer.memoryStorage();

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB (adjust)
  },
}).single("file");
