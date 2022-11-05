// Based on https://codepen.io/JonasBadalic/pen/ExqNzZ by Jonas Badalic and https://codepen.io/Unna/pen/WQoVWr by Gauthier Ressel

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
var ww = window.innerWidth;
var wh = window.innerHeight;
canvas.width = ww;
canvas.height = wh;
var circles = [];
var target = { x: -1000, y: -1000 };

// Configuration
const config = {
  circCount: (ww * wh) / 6000,
  circColors: ["255,255,255"],
  velocity: 0.2,
  minCircRadius: 4,
  maxCircRadius: 6,
  maxDistarceFromStart: (ww * wh) / 800,
  circLines: 3,
  minX: -20,
  maxX: ww + 20,
  minY: -20,
  maxY: wh + 20,
  opacityMultiplier: 15,
  minOpacity: 0.2,
};

const gradient = {
  currentMidPoint: 50,
  targetMidPoint: 50,
  currentPercent: 0.5,
  targetPercent: 0.5,
  calcNewCurrentPercent: () => {
    gradient.currentPercent = (gradient.currentMidPoint - 30) / 40;
    const difference = gradient.targetPercent - gradient.currentPercent;
    if (difference > 0.001) {
      return (gradient.currentPercent += gradient.getIncrement(
        gradient.currentMidPoint,
        gradient.targetMidPoint
      ));
    }
    if (difference < -0.001) {
      return (gradient.currentPercent -= gradient.getIncrement(
        gradient.currentMidPoint,
        gradient.targetMidPoint
      ));
    }
    return 0;
  },
  getIncrement: () => {
    const roundedTargetMidPoint =
      Math.round(gradient.targetMidPoint * 100) / 100;
    const difference =
      Math.round(
        Math.abs(gradient.currentMidPoint - roundedTargetMidPoint) * 1000
      ) / 1000;
    if (difference > 15) {
      return 0.012;
    }
    if (difference > 10) {
      return 0.01;
    }
    if (difference > 5) {
      return 0.005;
    } else {
      return 0.002;
    }
  },
  getCurrentMidPoint: () => {
    return (gradient.currentMidPoint = getComputedStyle(
      document.querySelector("body")
    )
      .getPropertyValue("--midPoint")
      .replace(/[^\d.]/g, ""));
  },
  setNewCurrentMidPoint: () => {
    const tempMidPoint =
      Math.round((gradient.currentPercent * 40 + 30) * 1000) / 1000;
    document
      .querySelector(":root")
      .style.setProperty("--midPoint", `${tempMidPoint}%`);
  },
  setTarget: () => {
    gradient.targetPercent = (mouse.x / ww + mouse.y / wh) / 2;
    gradient.targetMidPoint =
      Math.round((gradient.targetPercent * 40 + 30) * 1000) / 1000;
  },
};

const mouse = {
  x: 0,
  y: 0,
};

class Circle {
  constructor() {
    this.colorNumber = Math.floor(Math.random() * config.circColors.length);
    this.#setColor(this.colorNumber, 0.2);
    this.x = randomInt(config.minX, config.maxX);
    this.y = randomInt(config.minY, config.maxY);
    this.startX = this.x;
    this.startY = this.y;
    this.#randomizeMovement();
    this.radius = randomInt(config.minCircRadius, config.maxCircRadius);
    this.closest = [];
  }

  #setColor = (opacity) => {
    this.color = `rgba(${config.circColors[this.colorNumber]},${opacity})`;
  };

  #randomizeMovement = () => {
    this.direction = {
      x: -1 + Math.random() * 2,
      y: -1 + Math.random() * 2,
    };
    this.vx = config.velocity * Math.random();
    this.vy = config.velocity * Math.random();
  };

  #setOpacity = () => {
    const maxDistance = Math.sqrt(
      config.maxX * config.maxX + config.maxY * config.maxY
    );
    const currentDistance = this.#getDistance(mouse);
    let opacity =
      config.minOpacity +
      Math.pow(
        0.3,
        config.opacityMultiplier * (currentDistance / maxDistance)
      ) *
        (1 - config.minOpacity);
    this.#setColor(opacity);
  };

  #float = () => {
    this.x += this.vx * this.direction.x;
    this.y += this.vy * this.direction.y;
  };

  #changeDirection = (axis) => {
    this.direction[axis] *= -1;
  };

  #boundaryCheck = () => {
    if (this.x >= config.maxX) {
      this.x = config.maxX;
      this.#changeDirection("x");
    } else if (this.x <= config.minX) {
      this.x = config.minX;
      this.#changeDirection("x");
    }
    if (this.y >= config.maxY) {
      this.y = config.maxY;
      this.#changeDirection("y");
    } else if (this.y <= config.minY) {
      this.y = config.minY;
      this.#changeDirection("y");
    }
    if (
      Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2) >
      config.maxDistarceFromStart
    ) {
      this.#randomizeMovement();
    }
  };

  #draw = () => {
    this.#setOpacity();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
  };

  #findClosestcircles = () => {
    for (const p of circles) {
      if (this === p) {
        continue;
      }
      for (let k = 0; k < config.circLines; k++) {
        if (
          this.closest[k] === undefined ||
          this.#getDistance(p) < this.#getDistance(this.closest[k])
        ) {
          this.closest[k] = p;
          break;
        }
      }
    }
  };

  #drawLines = () => {
    this.closest.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(c.x, c.y);
      const gradient = ctx.createLinearGradient(this.x, this.y, c.x, c.y);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, c.color);
      ctx.strokeStyle = gradient;
      ctx.stroke();
    });
  };

  #getDistance = (p) => {
    const xDistance = Math.abs(this.x - p.x);
    const yDistance = Math.abs(this.y - p.y);
    return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
  };

  static setOutLines = () => {
    circles.forEach((p) => {
      p.#findClosestcircles();
    });
  };

  static drawLines = () => {
    circles.forEach((p) => {
      p.#drawLines();
    });
  };

  static createcircles = () => {
    for (let i = 0; i < config.circCount; i++) {
      const p = new Circle();
      circles.push(p);
    }
  };

  static drawcircles = () => {
    circles.forEach((p) => {
      p.#draw();
    });
  };

  static updatecircles = () => {
    circles.forEach((p) => {
      p.#float();
      p.#boundaryCheck();
    });
  };
}

function clearCanvas() {
  ctx.clearRect(0, 0, ww, wh);
}

function animatecircles() {
  Circle.drawcircles();
  Circle.drawLines();
  Circle.updatecircles();
}

function animateGradient() {
  gradient.calcNewCurrentPercent();
  gradient.getCurrentMidPoint();
  if (
    gradient.currentMidPoint !=
    Math.round(gradient.targetMidPoint * 100) / 100
  ) {
    gradient.setNewCurrentMidPoint();
  }
}

function animate() {
  clearCanvas();
  animatecircles();
  animateGradient();
  requestAnimationFrame(animate);
}

function init() {
  Circle.createcircles();
  Circle.drawcircles();
  Circle.setOutLines();
}

init();
requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  ww = window.innerWidth;
  wh = window.innerHeight;
  canvas.width = ww;
  canvas.height = wh;
  clearCanvas();
  circles = [];
  init();
});

window.addEventListener("mousemove", (e) => {
  let posx = (posy = 0);
  if (e.clientX || e.clientY) {
    posx =
      e.clientX +
      document.body.scrollLeft +
      document.documentElement.scrollLeft;
    posy =
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  mouse.x = posx;
  mouse.y = posy;
  gradient.setTarget();
});

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
