const express = require("express");
const app = express();
const cors = require("cors");
const Models = require('./models/user.model.js');
const fs = require("fs");
const formidable = require("formidable");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const uploadPath = "../carefu_watchers/src/uploads/";
const serverUploadLocation = "images";
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
// MIDDLE WARE
dotenv.config();

// const cloudinary = require("./config/cloudinaryConfig.js");

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, serverUploadLocation);
    }, 
    filename: (req, file, cb)=>{
        // console.log(file);
        cb(null, file.originalname);
    }
});

cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});



const uploads = (file, folder)=>{
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

const opts={
    overwrite: true,
    invalidate: true,
    resource_type: "auto",
};

const uploadImage = multer({storage : storage});
app.use(express.json());

const mongoose = require("mongoose");
app.use(cors({
    origin: true,
    method: ["GET", "POST", "HEAD"],
    credentials: true
}));
// mongoose.connect("mongodb://localhost:27017/careful-watchers-db");
mongoose.set("strictQuery", false);
// mongodb+srv://david_harold_005:<david_harold_005>@cluster0.fjkkauy.mongodb.net/?retryWrites=true&w=majority
mongoose.connect(process.env.MONGOOSE_STRING, {
    useNewUrlParser:true,
}).then(()=>{
    console.log("succeeded");
}).catch((err)=>{
    console.log(err);
});

app.post("/api/register", async(req, res)=>{

    let receivedItems = JSON.parse(JSON.stringify(req.body));
    try{
        const user = await Models.userModel.create({
            name : receivedItems.data.signupName,
            email: receivedItems.data.signupEmail,
            password : receivedItems.data.signupPassword
        }) ;
        res.json({status : 'ok'});
    }catch(err){
        console.log(err);
        res.json({status: 'error', error: err});
    }
});


// app.post("/api/login-user", async(req, res)=>{

//     let receivedItems = JSON.parse(JSON.stringify(req.body));
//     try{
//         const user = await Models.userModel.create({
//             name : receivedItems.data.signupName,
//             email: receivedItems.data.signupEmail,
//             password : receivedItems.data.signupPassword
//         }) ;
//         res.json({status : 'ok'});
//     }catch(err){
//         console.log(err);
//         res.json({status: 'error', error: err});
//     }



// });

app.post("/api/upload-article", async(req, res)=>{
    let receivedItems = JSON.parse(JSON.stringify(req.body));
    let articleTitle = receivedItems.otherData.articleTitle;
    let articleContent = receivedItems.otherData.articleContent;
    try{
        const post = await Models.artModel.create({
            articleTitle: articleTitle,
            articleContent: articleContent
        });
        // res.json({status: "success"});
        res.send(`TItle is: ${articleTitle}, content is:  ${articleContent}`);
    }catch(err){
        res.json({status : "error", error: err});
    }
    

});


app.post("/api/upload", (req, res)=>{

});


app.post("/api/upload-photo", (req, res)=>{
    // Send a picture to the backend;
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files)=>{
        let oldPath = files.filetoupload.filepath;
        let newPath = "C:/Users/Admin/react_apps/c_w_back/models/uploads/"+files.filetoupload.originalFilename;
        fs.rename(oldPath, newPath, function(err){
            if(err){
                throw(err);
            }
            res.write(`File Uploaded +++ ${newPath}`);

        });

    })

});

app.post("/api/multer-photo-upload", uploadImage.single("form-image"), async(req, res, next)=>{
    //res.send("You have hit the api");
    //Upload the rest of the form here.
    var localFilePath = req.file.path;
    let articleTitle = req.body.articleTitle;
    let articleContent = req.body.articleContent;
    let datePosted = new Date().toLocaleString();
    await uploadToCloudinary(localFilePath, articleTitle, articleContent, datePosted).then((result)=>{
        res.send(result);
    });
    // let feedBack = uploadToMongoose();
    // res.send(`Photo Url is: ${feedBack}`);
    // res.send(localFilePath);
    // console.log(result);

});


const uploadToMongoose = async (aTitle, aContent, dPosted, pUrl)=>{
    try{
        const post = await Models.artModel.create({
            articleTitle: aTitle,
            articleContent: aContent,
            articlePhoto : pUrl,
            dateUploaded : dPosted
        });
        // res.json({status: "success"});
        return (`Photo Url is: ${pUrl}`);
    }catch(err){
        return({status : "error", error: err});
    }
}



async function uploadToCloudinary(
    localFilePath,
    articleTitle, 
    articleContent, 
    datePosted){
    // Remove the previous file here

    cloudinary.uploader.upload(localFilePath).then((result)=>{
        // console.log(result);
        let imageUrl = result.secure_url;
        uploadToMongoose(articleTitle, articleContent, datePosted, imageUrl);
        
    });
}



const fetchAllArticles = async()=>{
    const cus = Models.artModel.find().cursor();
    const result = [];
    for(let doc = await cus.next(); doc!=null; doc = cus.next()){
    result.push(doc);
    }



    return result;
}

app.get("/api/fetch-records", (req, res)=>{
    // const response = fetchAllArticles();
    Models.artModel.find((err, docs) => {
        if (!err) {

            res.send(docs);
        } else {
            
            res.send('Failed to retrieve posted articles ' + err);
        }
    }).sort({_id : -1});
    // console.log(response);
});


app.get("/api/fetch-records-front", (req, res)=>{
    // const response = fetchAllArticles();
    Models.artModel.find((err, docs) => {
        if (!err) {

            res.send(docs);
        } else {
            
            res.send('Failed to retrieve posted articles ' + err);
        }
    }).sort({_id : -1}).limit(3);
    // console.log(response);
});


app.get("/api/fetch-highlights", (req, res)=>{
    // const response = fetchAllArticles();
    const query = Models.artModel.find().limit(3);

    query.exec(function(err, docs){
        if (!err) {
            res.send(docs);
        } else {
            
            res.send('Failed to retrieve posted articles ' + err);
        }
    });
    // console.log(response);
});

// app.get("/api/fetch-records-front", (req, res)=>{
//     // const response = fetchAllArticles();
//     Models.artModel.find((err, docs) => {
//         if (!err) {

//             res.send(docs);
//         } else {
            
//             res.send('Failed to retrieve posted articles ' + err);
//         }
//     }).limit(3);
//     // console.log(response);
// });



app.post("/api/login-user", async (req, res)=>{

    // Fetch email and password here
    let receivedItems = JSON.parse(JSON.stringify(req.body));
    let emailVal = receivedItems.data.emailField;
    let passwordVal = receivedItems.data.passwordField;

    await Models.userModel.findOne({
        email: emailVal,
        password: passwordVal
    }).then((User)=>{
        if(User){
            res.send(User);
        }else{
            res.send("null");
        }
    });

    // console.log(receivedItems);


    // Models.userModel.countDocuments({
    //          email: emailVal,
    //          password: passwordVal}, function (err, count){ 
    //     if(count>0){
    //         res.send("found");
    //     }else{
    //         res.send
    //     }
    // }); 

});

app.post("/api/send-message", async(req, res)=>{
    let receivedItems = JSON.parse(JSON.stringify(req.body));
    let messenger_name = receivedItems.data.userName;
    let messenger_email = receivedItems.data.userEmail;
    let messenger_phone = receivedItems.data.userPhone;
    let message_subject = receivedItems.data.messageSubject;
    let message_body = receivedItems.data.messageMain;
    let date_sent = new Date().toLocaleDateString();
    let msg_status = "NEW";

    // console.log(`Messenger_name: ${messenger_name},
    //     Messenger_phone: ${messenger_phone},
    //     Messenger_email : ${messenger_email},
    //     Message_title : ${message_subject},
    //     Message_content : ${message_body}
    // `);
    try{
            await Models.msgModel.create({
            message_sender_name: messenger_name,
            message_sender_phone: messenger_phone,
            message_sender_email: messenger_email,
            message_title : message_subject,
            message_content: message_body,
            mesage_send_date: date_sent,
            message_status : msg_status 
        });
        res.send({status : "success"});
    }catch(err){
        res.send({status : "error", error : err});
    }
});


app.get("/api/fetch-messages", async(req, res)=>{
    Models.msgModel.find((err, docs)=>{
        if(!err){
            res.send(docs);
        }else{
            res.send({status : "success", message: "success"});
        }
    })
});


app.get("/api/fetch-single-record/:id", async(req, res)=>{
    const id = req.params.id;
    await Models.artModel.findOne({
        _id: id
    }).then((response)=>{
        res.send(response);
        
    });
});


app.get("/api/delete-record/:id", async(req, res)=>{
    const id = req.params.id;
    await Models.artModel.findOneAndRemove({ _id: req.params.id })
    .then((record) => {
      if (!record) {
        res.status(400).send(req.params.id + ' was not found');
      } else {
        res.status(200).send(req.params.id + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});



app.post("/api/send-company-mail", (req, res)=>{
//     let recItems = JSON.parse(JSON.stringigy(req.body));
//     let userName = recItems.data.userName;
//     let userEmail = recItems.data.userEmail;
//     let userPhone = recItems.data.userPhone;
//     let userMessage = recItems.data.userMessage;



//     let transporter = nodemailer.createTransport({
//         host: process.env.MAIL_HOST,
//         port: 2525,
//         auth: {
//             user: process.env.MAIL_USER,
//             pass: process.env.MAIL_PASS
//         }



// });

// message = {
//     from: userEmail,
//     to: "eluan.harold@gmail.com",
//     subject: "New message from customer",
//     html: "<h1>New Message From " + userName + "</h1><br /><p>"+userMessage+"</p><ul><li>User Email:" +userEmail+ "</li><li>User Phone :"+userPhone+"</li></ul>"
// }
// transporter.sendMail(message, function(err, info) {
//     if (err) {
//       console.log(err)
//     }else{
//       console.log(info);
//     }

// });
console.log("API HAS BEEN HIT");
res.send("You have reached here");
});


app.post("/api/just-to-test", (req, res)=>{

    res.send("test is working");
    console.log("You have hit the api");
})
// APP LISTINING AT THIS PORT
app.listen(process.env.PORT, ()=>{
    console.log("App started on port 1337");
});






app.post("/api/submit-form", (req, res) => {
   let receivedItems = JSON.parse(JSON.stringify(req.body));
    console.log(receivedItems)
//   const transport = nodemailer.createTransport({
//     host: "server295.web-hosting.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.CF_HOST,
//       pass: process.env.CF_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.CF_HOST,
//     to: receivedItems.data.email,
//     subject: "Quotation request from " + receivedItems.data.name,
//     text: "Welcome to our Careful Watchers !,\n\nWe are committed to providing top-notch cybersecurity solutions to protect your business from potential cyber threats. Our team of experts is dedicated to keeping your sensitive data and assets safe from unauthorized access.\n\n If you are interested in learning more about our services, we would be happy to connect with you. Depending on your preference, we can either set up a call with one of our consultants or a Zoom meeting to discuss your specific needs and how we can help you achieve your cybersecurity goals. \n\n Please feel free to reach out to us at any time to schedule a call or Zoom meeting or request for our service quotation. \n\n We look forward to hearing from you and helping you secure your business against cyber threats. \n\nSincerely,\n\nTope Daisi\nCareful Watchers",
//   };

//   const mailOptionsSecond = {
//     from: receivedItems.data.email,
//     to: process.env.CF_HOST,
//     subject: "Quotation request from " + receivedItems.data.name,
//     text: req.body.message,
//   };
//   transport.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log("Email sent: " + info.response);
//       res.send("Email sent successfully");
//     }
//   });

//   transport.sendMail(mailOptionsSecond, (error, info) => {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log("Email sent: " + info.response);
//       res.send("Email sent successfully");
//     }
//   });
});


app.post("/api/contact-form", (req, res)=>{
    
    let receivedItems = JSON.parse(JSON.stringify(req.body));
    const transport = nodemailer.createTransport({
    host: "server295.web-hosting.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.CF_HOST,
      pass: process.env.CF_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.CF_HOST,
    to: receivedItems.Email,
    subject: "Contact request from " + receivedItems.UserName,
    text: "Welcome to our Careful Watchers !,\n\n Thank you for reaching out to us we will contact you shortly!",
  };

  const mailOptionsSecond = {
    from: process.env.CF_HOST,
    to: "support@carefulwatchers.co.uk",
    subject: "Contact request from " + receivedItems.UserName,
    // text: "Dear Admin you have a contact request from " + receivedItems.data.userMessage,
    text : `Dear Admin you have a contact request from ${receivedItems.UserName}\n
            With email address : ${receivedItems.Email}\n
            ${receivedItems.Message}
    `
  };
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      res.send("Email sent successfully");
    }
  });

  transport.sendMail(mailOptionsSecond, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      res.send("Email sent successfully");
    }
  });
// console.log("we are here now>>>>");
});
