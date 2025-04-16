const multer = require("multer");
const path = require("path");

// Define storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Check the file type and determine the destination folder
    const fileType = file.mimetype.split("/")[0]; // Get file type (image, audio, etc.)

    // Set the destination folder based on file type
    let uploadPath = "uploads/";

    if (fileType === "image") {
      uploadPath += "images/";
    } else if (fileType === "audio") {
      uploadPath += "audios/";
    } else {
      uploadPath += "others/"; // Default folder for unsupported file types
    }

    // Create the directory if it doesn't exist
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Set the filename to include the original file name and extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Define file filter to allow only images, audios, or other types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "audio/mpeg", "audio/wav"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Unsupported file type"), false); // Reject the file
  }
};

// Set up multer upload with storage configuration and file filter
const upload = multer({ storage, fileFilter });

module.exports = upload;
