// backend/middleware/uploadMiddleware.js
// Handles image uploads to Cloudinary using multer

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary with our credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Tell multer to store files directly in Cloudinary (not on our server)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'waste-tracker',       // All images go in this Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }], // Resize on upload
  },
});

// 3. Create the upload handler (max 5MB per file)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

module.exports = { upload, cloudinary };