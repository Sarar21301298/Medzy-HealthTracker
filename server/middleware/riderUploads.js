import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const privateRoot = path.join(__dirname, '..', 'private-uploads');
const riderRoot = path.join(privateRoot, 'riders');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDirectory(privateRoot);
ensureDirectory(riderRoot);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const riderId = String(req.user?.id || 'anonymous');
    const riderDir = path.join(riderRoot, riderId);
    ensureDirectory(riderDir);
    cb(null, riderDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const extension = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
  }
  cb(null, true);
};

export const riderUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const riderNidUpload = riderUpload.fields([
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
  { name: 'selfieWithNid', maxCount: 1 }
]);

export function getPrivateUploadPath(...segments) {
  return path.join(privateRoot, ...segments);
}
