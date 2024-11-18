const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config()

const userSchema = mongoose.Schema({
    username:{
        type:String,
        required:true,
        min:3,
        max:30,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        min:6,
        max:20
    },
    avatar: {
        type: String
    },
    bio:{
        type:String
    }
})

const generateJwtToken = (id)=>{
  return jwt.sign({id},process.env.Scretkey,{expiresIn:'1d'})
}
const User = mongoose.model("user",userSchema);

module.exports = {User,generateJwtToken};
