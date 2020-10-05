const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const players = {};

io.on('connection', (socket) => {
  console.log(`> Player connected: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: Math.round(Math.random() * 700) + 50,
    y: 450,
    animation: 'turn',
  };

  socket.emit('currentPlayers', players);

  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('playerMovement', ({ x, y, animation }) => {
    players[socket.id].x = x;
    players[socket.id].y = y;
    players[socket.id].animation = animation;

    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

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
