const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

function dbConnection(){
    const params = {
        useNewUrlParser:true,
        useUnifiedTopology:true

    }
    try {
        mongoose.connect(process.env.Mongo_Url,params);
        console.log("Mongodb connected successfully")
    } catch (error) {
        console.log("Mongodb connection error",error)
        
    }
}

module.exports = {dbConnection} 
