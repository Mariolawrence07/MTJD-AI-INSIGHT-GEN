// backend/middleware/upload.middleware.js
import pkg from "multer";
const multer = pkg.default || pkg;

const storage = multer.memoryStorage();

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB (adjust)
  },
}).single("file");
