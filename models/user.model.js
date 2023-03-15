const mongoose = require("mongoose");

const User = new mongoose.Schema(
    {
        name : {type: String, required : true},
        email : { type : String, required: true, unique: true},
        password : {type: String, required : true}
    },{collection: 'users'}
)

const model = mongoose.model('UserData', User)




const articles = new mongoose.Schema(
    {
        articleTitle: {type: String, required: true},
        articleContent: {type : String, required: true},
        articlePhoto : {type : String, require: true},
        dateUploaded : {type: String, required: true}
        
    },{collection: "articles"}
)
const artModel = mongoose.model("articles", articles)





const messages = new mongoose.Schema({
    message_sender_name: {type : String, required: true},
    message_sender_phone: {type: String, required: true},
    message_sender_email: {type: String, required: true},
    message_title : {type: String, required: true},
    message_content: {type: String, required : true},
    mesage_send_date: {type: String, required: true},
    message_status : {type: String, required: true}
}, {collection: "messages"});

const msgModel = mongoose.model("messages", messages);

const newsLetterSub = new mongoose.Schema({
    news_letter_sub_email : {type : String, required: true}
}, {collection: "newsletters_sub"});

// EXPORTS

module.exports = {artModel : artModel, userModel : model, msgModel: msgModel};