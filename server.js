const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { joinRoom, currentUser, leaveRoom, roomUsers} = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = 4500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';


io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = joinRoom(socket.id, username, room);
    socket.join(user.room);
    socket.emit('message', formatMessage(botName, 'Hello'));
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined`)
  );

    io.to(user.room).emit('roomUsers', {
      room: user.room, users: roomUsers(user.room)
    });
  });

  socket.on('chatMessage', msg => {const user = currentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  socket.on('disconnect', () => {
    const user = leaveRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: roomUsers(user.room)
      });
    }
  });
});
