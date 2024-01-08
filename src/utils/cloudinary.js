import {v2 as cloudinary} from 'cloudinary';
import  fs from 'fs';
import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINAY_CLOUD_NAME, 
  api_key: process.env.CLOUDINAY_API_KEY , 
  api_secret: process.env.CLOUDINAY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary
     const response =  await  cloudinary.uploader.upload(localFilePath, {
            resource_type :"auto",
        });
        // file has been successfully uploaded
        console.log("File has been uploaded on cloudinary" , response.url);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
    }
}