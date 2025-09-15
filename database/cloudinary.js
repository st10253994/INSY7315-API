const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'listings', // folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // optional
  },
});

// Configure Multer storage for Cloudinary
const dynamicStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    return {
      folder: isImage ? "BookingImages" : "bookingFiles",
      resource_type: isImage ? "image" : "raw",
      allowed_formats: isImage 
        ? ["jpg", "png", "jpeg"]
        : ["pdf", "docx", "doc"],
    };
  },
});
const uploadFiles = require('multer')({ storage: dynamicStorage });

const upload = require('multer')({ storage });

module.exports = {
   cloudinary, 
   upload,
   uploadFiles
};
