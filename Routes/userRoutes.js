const express = require('express');
const { User,generateJwtToken } = require('../Model/userModel.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;


dotenv.config();


const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const uploads = multer({ storage });

router.post("/signup", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: "User Already exist" });
    }
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: "All credentials are required" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user = await new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    }).save();
    const token = generateJwtToken(user._id);
    res.status(200).json({ message: "Signup successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!req.body.email || !req.body.password) {
      res.status(400).json({ message: "All credentials are required" });
    }

    if (!user) {
      res.status(400).json({ message: "User doesn't exists" });
    }

    const validatePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validatePassword) {    
      res.status(400).json({ message: "Incorrect Password" });
    }
    const token = generateJwtToken(user._id);
    res.status(200).json({ message: "SignIn Successfully", user, token });
  } catch (error) {
    console.log("signin error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/forget-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!req.body.email) {
      res.status(400).json({ message: "Email Required" });
    }
    if (!user) {
      res.status(400).json({ message: "User doesn't exist" });
    }

    const secret = user.password + process.env.Scretkey;
    const token = jwt.sign({ _id: user._id, email: user.email }, secret, {
      expiresIn: "5m",
    });
    console.log(token);
    const link = `http://localhost:3000/reset-password/${user._id}/${token}`;
    console.log(link);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      secure: false,
      auth: {
        user: process.env.Mail,
        pass: process.env.Mail_Password,
      },
    });

    // send mail with defined transport object
    let details = {
      from: process.env.USER, // sender address
      to: req.body.email, // list of receivers
      subject: "Reset-Password", // Subject line
      text: link,
    };

    transporter.sendMail(details, (err) => {
      if (err) {
        console.log("error", err);
      } else {
        console.log("email sent");
      }
    });
    res.json(link);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
});

router.put("/reset-password/:id/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const userdata = await User.findOne({ _id: req.params.id });
    console.log(token);
    if (!userdata) {
      res.json({ message: "User doesn't exist" });
    }
    const secret = userdata.password + process.env.Scretkey;
    const verify = jwt.verify(token, secret);
    const salt = await bcrypt.genSalt(10);
    const confirmPassword = await bcrypt.hash(password, salt);
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      {
        $set: {
          password: confirmPassword,
        },
      }
    );
    res.send({ email: verify.email, status: "verified", user });
  } catch (error) {
    res.json({ status: "Something Went Wrong" });
    console.log(error);
  }
});

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Assuming token is in the Authorization header
  if (!token) {
    return res.status(403).json({ message: 'Access Denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use secret key for verification
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// router.get("/getuser/:id", async (req, res, next) => {
//   try {
//     const { _id } = req.params.id;
//     const user =  await User.findOne(_id)
//     if (user) {
//       res.status(200).json({ user, success: true });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       error,
//       message: "User Not Found",
//     });
//   }
// });

router.get("/getuser/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    if (userId !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to access this data" });
    }
    
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json({ user, success: true });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getall",async(req,res)=>{
  try {
    const user = await User.find({});
   if(!user){
    res.status(400).json({message:"Data not found"})
   }else{
    return res.status(200).json({message:"Data found successfully",user})
   }

  } catch (error) {
    console.log(error)
    res.status(500).json({message:"Internal Server Error"})
  }
})

// router.put("/edit/:id",upload.single('avatar'),async(req,res)=>{

  
//   try {
//    let avatar ;

//    let BASE_URL = process.env.BACKEND_URL;
//         if(process.env.NODE_ENV === "production"){
//             BASE_URL = `${req.protocol}://${req.get('host')}`
//         }
//    if(req.file){
//     avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`
// }
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       {...req.body,avatar},
//       {new:true}
//     )
//     if(!user){  
//       return res.status(400).json({message:"Error Occured In Updation"})
//     }
//     res.status(200).json({message:"Updated Successfully",data:user})
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({message:"Internal Server Error"})
//   }
// })

// const router = require('express').Router();
// const upload = require('multer')(); // Assuming multer is used to handle file uploads

router.put("/edit/:id", uploads.single("avatar"), async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("User ID:", userId); // Log the userId to ensure it's correct
    const user = await User.findById(userId); // Use findById to fetch by user ID

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let avatarUrl;
    if (req.file) {
      console.log("File received:", req.file); // Log file info for debugging

      avatarUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
          resource_type: "image",
          folder: 'users', 
        }, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error); // Log the error
            return reject(new Error("Cloudinary upload error."));
          }
          console.log("Cloudinary upload result:", result); // Log the result
          resolve(result.secure_url);
        });
        
        // Ensure the stream is closed properly after uploading
        uploadStream.end(req.file.buffer);
      });
    }

    // Update user details
    user.username = req.body.username || user.username;
    user.bio = req.body.bio || user.bio;
    if (avatarUrl) {
      user.avatar = avatarUrl; // Update the avatar URL
    }

    // Save the updated user
    const updatedUser = await user.save();
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error); // Log the error
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


module.exports = router;

 const userRouter = router;

 module.exports = {userRouter}