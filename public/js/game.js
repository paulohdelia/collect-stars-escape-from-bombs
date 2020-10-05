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

  createScenario(this);
}

function update() {}

function createScenario(self) {
  self.add.image(400, 300, 'sky');

  self.platforms = self.physics.add.staticGroup();

  self.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  self.platforms.create(600, 400, 'ground');
  self.platforms.create(50, 250, 'ground');
  self.platforms.create(750, 220, 'ground');
}
