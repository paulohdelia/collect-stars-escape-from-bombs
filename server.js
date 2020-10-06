const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const players = {};

const starType = [
  { points: 5, color: 0xffff44 },
  { points: 10, color: 0x00ff00 },
  { points: 30, color: 0xff0000 },
];

const scores = {};

const star = {
  x: random(50, 750),
  y: 100,
  ...starType[0],
  newStar: () => {
    const x = random(0, 100);
    let type = starType[0];
    if (x < 5) {
      type = starType[2];
    } else if (x < 40) {
      type = starType[1];
    }

    star.x = random(50, 750);
    star.color = type.color;
    star.points = type.points;

    return;
  },
};

let bombCont = -1;
const bombs = {};

io.on('connection', (socket) => {
  console.log(`> Player connected: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: random(50, 750),
    y: 450,
    animation: 'turn',
  };

  scores[socket.id] = {
    id: socket.id,
    points: 0,
  };

  socket.emit('currentPlayers', players);

  socket.emit('starLocation', star);

  socket.emit('currentBombs', bombs);

  socket.broadcast.emit('newPlayer', players[socket.id]);

  io.emit('scoreUpdate', scores);

  socket.on('playerMovement', ({ x, y, animation }) => {
    players[socket.id].x = x;
    players[socket.id].y = y;
    players[socket.id].animation = animation;

    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('playerHitted', (bomb) => {
    delete bombs[bomb.id];

    if (scores[socket.id].points > 0) {
      scores[socket.id].points -= 3;
    }

    socket.broadcast.emit('destroyBomb', bomb.id);
    io.emit('scoreUpdate', scores);
  });

  socket.on('starCollected', ({ points }) => {
    bombCont++;

    bombs[bombCont] = {
      id: bombCont,
      x: star < 400 ? random(450, 750) : random(50, 350),
      y: 16,
      velocity: {
        x: random(-200, 200),
        y: random(20, 30),
      },
    };

    star.newStar();

    scores[socket.id].points += points;

    io.emit('newBomb', bombs[bombCont]);
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

app.use(express.static(__dirname + '/public'));

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on ${port}`);
});
