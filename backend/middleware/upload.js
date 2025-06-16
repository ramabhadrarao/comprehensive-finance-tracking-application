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

// Helper function to determine upload type from fieldname
const getUploadTypeFromFieldname = (fieldname) => {
  if (fieldname === 'documents' || fieldname === 'document') {
    return 'documents';
  } else if (fieldname === 'avatar' || fieldname === 'profileImage') {
    return 'avatar';
  } else if (fieldname === 'receipt') {
    return 'receipt';
  } else if (fieldname === 'agreement') {
    return 'agreement';
  } else if (fieldname === 'company') {
    return 'company';
  }
  return 'documents'; // default
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine type from fieldname (ignore req.body.type as it's used for payment type)
    const type = getUploadTypeFromFieldname(file.fieldname);
    
    let uploadPath = uploadPaths.documents; // default
    
    if (type === 'avatar') {
      uploadPath = uploadPaths.avatars;
    } else if (type === 'receipt') {
      uploadPath = uploadPaths.receipts;
    } else if (type === 'agreement') {
      uploadPath = uploadPaths.agreements;
    } else if (type === 'company') {
      uploadPath = uploadPaths.company;
    } else {
      uploadPath = uploadPaths.documents;
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

  // Determine type from fieldname (ignore req.body.type as it's used for payment type)
  const type = getUploadTypeFromFieldname(file.fieldname);
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check if the type exists in allowedTypes and if the extension is allowed
  if (allowedTypes[type] && allowedTypes[type].includes(ext)) {
    cb(null, true);
  } else {
    // Provide better error message
    const allowedExts = allowedTypes[type] || allowedTypes.documents;
    cb(new Error(`Invalid file type. Allowed types for ${type}: ${allowedExts.join(', ')}`), false);
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

// Enhanced error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
  console.error('Upload error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Too many files. Maximum 5 files allowed.',
        error: 'TOO_MANY_FILES'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        message: `Unexpected field: ${err.field}`,
        error: 'UNEXPECTED_FIELD'
      });
    }
  }
  
  if (err && err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      success: false,
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  // For any other upload-related errors
  if (err) {
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: 'UPLOAD_FAILED',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  next();
};