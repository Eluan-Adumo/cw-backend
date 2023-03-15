const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
    cloud_name : "dalhpnank",
    api_key: "555898314426173",
    api_secret: "0G2L__jC5YVFfP-r8MGXzZLZ2dA"
});


exports.uploads = (file, folder)=>{
    return new Promise(resolve =>{
        cloudinary.UploadStream.upload(file, (result)=>{
            resolve({
                url : result.url,
                id: result.public_id
            })
        }, {
            resource_type : "auto",
            folder : folder
        })
    })
}