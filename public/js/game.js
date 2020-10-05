const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/ground.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.spritesheet('dude', 'assets/dude.png', {
    frameWidth: 32,
    frameHeight: 48,
  });
}

function create() {
  const self = this;

  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  addScenario(this);
  addPlayersAnimation(this);

  this.socket.on('currentPlayers', (currentPlayers) => {
    for (const playerId in currentPlayers) {
      const player = currentPlayers[playerId];

      if (self.socket.id === player.id) {
        addPlayer(self, player);
      } else {
        addOtherPlayer(self, player);
      }
    }
  });

  this.socket.on('newPlayer', (player) => {
    addOtherPlayer(self, player);
  });

  this.socket.on('playerMoved', (player) => {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (player.id === otherPlayer.id) {
        otherPlayer.setPosition(player.x, player.y);
        otherPlayer.anims.play(player.animation, true);
      }
    });
  });

  this.socket.on('disconnect', (playerId) => {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (playerId === otherPlayer.id) {
        otherPlayer.destroy();
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  handleKeyboardInput(this);
}

function addScenario(self) {
  self.add.image(400, 300, 'sky');

  self.platforms = self.physics.add.staticGroup();

  self.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  self.platforms.create(600, 400, 'ground');
  self.platforms.create(50, 250, 'ground');
  self.platforms.create(750, 220, 'ground');
}

function addPlayer(self, player) {
  self.player = self.physics.add.sprite(player.x, player.y, 'dude');

  self.player.setBounce(0.2);
  self.player.setCollideWorldBounds(true);

  self.physics.add.collider(self.player, self.platforms);
}

function addOtherPlayer(self, player) {
  const otherPlayer = self.physics.add.sprite(player.x, player.y, 'dude');
  otherPlayer.setBounce(0.2);
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.setTint(0x00ff99);
  otherPlayer.id = player.id;
  otherPlayer.anims.play(player.animation, true);

  self.physics.add.collider(otherPlayer, self.platforms);

  self.otherPlayers.add(otherPlayer);
}

function addPlayersAnimation(self) {
  self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  self.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20,
  });

  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });
}

function handleKeyboardInput(self) {
  if (self.player) {
    if (self.cursors.left.isDown) {
      self.player.setVelocityX(-160);
      self.player.anims.play('left', true);
    } else if (self.cursors.right.isDown) {
      self.player.setVelocityX(160);
      self.player.anims.play('right', true);
    } else {
      self.player.setVelocityX(0);
      self.player.anims.play('turn');
    }
    if (self.cursors.up.isDown && self.player.body.touching.down) {
      self.player.setVelocityY(-330);
    }
    const x = self.player.x;
    const y = self.player.y;
    const animation = self.player.anims.currentAnim.key;
    if (
      self.player.oldState &&
      (x !== self.player.oldState.x ||
        y !== self.player.oldState.y ||
        animation !== self.player.oldState.animation)
    ) {
      self.socket.emit('playerMovement', {
        x: self.player.x,
        y: self.player.y,
        animation: self.player.anims.currentAnim.key,
      });
    }
    self.player.oldState = {
      x: self.player.x,
      y: self.player.y,
      animation: self.player.anims.currentAnim.key,
    };
  }
}
