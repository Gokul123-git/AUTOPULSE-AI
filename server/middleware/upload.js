import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
});

const imageUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Vehicle image must be a JPEG, PNG, GIF, or WebP image.'), false);
  },
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);
export const uploadImageFields = (fields) => imageUpload.fields(fields);

export default upload;
