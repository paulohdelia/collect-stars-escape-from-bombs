const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const players = {};

const starType = [
  { points: 5, color: 0xffff44 },
  { points: 10, color: 0x00ff00 },
  { points: 20, color: 0xff0000 },
];

const scores = {};

const star = {
  x: Math.round(Math.random() * 700) + 50,
  y: 100,
  ...starType[0],
  newStar: () => {
    const x = Math.random();
    let type = starType[0];
    if (x < 0.1) {
      type = starType[2];
    } else if (x < 0.4) {
      type = starType[1];
    }

    star.x = Math.round(Math.random() * 700) + 50;
    star.color = type.color;
    star.points = type.points;

    return;
  },
};

io.on('connection', (socket) => {
  console.log(`> Player connected: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: Math.round(Math.random() * 700) + 50,
    y: 450,
    animation: 'turn',
  };

  scores[socket.id] = {
    id: socket.id,
    points: 0,
  };

  socket.emit('currentPlayers', players);

  socket.emit('starLocation', star);

  socket.broadcast.emit('newPlayer', players[socket.id]);

  io.emit('scoreUpdate', scores);

  socket.on('playerMovement', ({ x, y, animation }) => {
    players[socket.id].x = x;
    players[socket.id].y = y;
    players[socket.id].animation = animation;

    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', ({ points }) => {
    scores[socket.id].points += points;

    star.newStar();

    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });

  socket.on('disconnect', () => {
    console.log(`> Player disconnected: ${socket.id}`);

    delete players[socket.id];
    delete scores[socket.id];

    io.emit('scoreUpdate', scores);

    io.emit('disconnect', socket.id);
  });
});

app.use(express.static('public'));

server.listen(3000, () => {
  console.log(`Listening on ${server.address().port}`);
});
