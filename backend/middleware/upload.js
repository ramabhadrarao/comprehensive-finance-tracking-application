import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadPaths = {
  documents: path.join(__dirname, '../uploads/documents'),
  avatars: path.join(__dirname, '../uploads/avatars'),
  receipts: path.join(__dirname, '../uploads/receipts'),
  agreements: path.join(__dirname, '../uploads/agreements'),
  company: path.join(__dirname, '../uploads/company')
};

Object.values(uploadPaths).forEach(uploadPath => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadPaths.documents; // default
    
    if (req.body.type === 'avatar') {
      uploadPath = uploadPaths.avatars;
    } else if (req.body.type === 'receipt') {
      uploadPath = uploadPaths.receipts;
    } else if (req.body.type === 'agreement') {
      uploadPath = uploadPaths.agreements;
    } else if (req.body.type === 'company') {
      uploadPath = uploadPaths.company;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    documents: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    avatar: ['.jpg', '.jpeg', '.png', '.gif'],
    receipt: ['.pdf', '.jpg', '.jpeg', '.png'],
    agreement: ['.pdf', '.doc', '.docx'],
    company: ['.jpg', '.jpeg', '.png', '.svg']
  };

  const type = req.body.type || 'documents';
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes[type] && allowedTypes[type].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types for ${type}: ${allowedTypes[type].join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files per request
  }
});

// Export different upload configurations
export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size allowed is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Maximum 5 files allowed.' 
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
};