
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;


// console.log("Cloudinary environment check:", {
//   cloudNameLoaded: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
//   apiKeyLoaded: Boolean(process.env.CLOUDINARY_API_KEY),
//   apiSecretLoaded: Boolean(process.env.CLOUDINARY_API_SECRET),
// });