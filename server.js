const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const players = {};

io.on('connection', (socket) => {
  console.log(`> Player connected: ${socket.id}`);

  players[socket.id] = {
    score: 0,
    x: Math.round(Math.random() * 700) + 50,
    y: 450,
  };

  socket.on('disconnect', () => {
    console.log(`> Player disconnected: ${socket.id}`);

    delete players[socket.id];

    io.emit('disconnect', socket.id);
  });
});

app.use(express.static('public'));

server.listen(3000, () => {
  console.log(`Listening on ${server.address().port}`);
});
