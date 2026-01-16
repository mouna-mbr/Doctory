const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/licenses");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const role = req.body.role || "license";
    cb(null, `${role.toLowerCase()}-license-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === "image/jpeg" || 
                   file.mimetype === "image/jpg" || 
                   file.mimetype === "image/png" || 
                   file.mimetype === "application/pdf";

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG) and PDF files are allowed for license documents!"));
  }
};

// Upload middleware
const licenseUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: fileFilter,
});

module.exports = licenseUpload;
