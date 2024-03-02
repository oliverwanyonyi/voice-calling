const express = require('express');
const http = require('http');
const socketIo = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = socketIo(server,{
  cors:{
    origin:['http://localhost:5173','https://b183-102-212-236-160.ngrok-free.app'],
    methods:['GET', "POST"]
  }
})

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.emit('me', socket.id)

  socket.on('disconnect', (socket) => {
    io.emit('callended')
    console.log('User disconnected:');
  });

  socket.on('calluser', (data) => {
    // Handle incoming call request
    console.log(data);
    io.to(data.userToCall).emit('calluser', {signal:data.signalData, from: data.from,name:data.name });
  });

  socket.on('answercall', (data) => {
    // Handle call acceptance
    io.to(data.to).emit('callaccepted', data.signal);
  });

  // Add more event handlers as needed
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
