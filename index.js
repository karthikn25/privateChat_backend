const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const {dbConnection}=require('./db.js');
const {userRouter}=require('./Routes/userRoutes.js')
const bodyParser = require('body-parser');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')))


dbConnection();

app.use("/api/user",userRouter);


const server = app.listen(PORT,()=>console.log(`Server running Port:${PORT}`))

const io = require('socket.io')(server,{
    cors:{
      origin:"*"
    }
});

io.on('connection',(socket)=>{
  console.log(socket.id);


  socket.on("send-message",(msgText,roomId)=>{
    

    if(roomId===''){
        socket.broadcast.emit('receive-message',msgText)

    }else{
        socket.broadcast.to(roomId).emit('receive-message',msgText)
    }

  })

  socket.on("join-room",(room,cb)=>{
    console.log(room);
    cb(room)
  })

 

})