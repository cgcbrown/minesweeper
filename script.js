var c = document.getElementById("myCanvas");
c.width = document.body.clientWidth;
c.height = document.body.clientHeight;
var ctx = c.getContext("2d");

var mouse = {
  x: 0,
  y: 0
}

var colors = [
  '#E0F5FF',
  '#4A6E80',
  '#94DBFF',
  '#707A80',
  '#76AFCC'
]

function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}


// Drawing Functions
function drawLine(x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color ? color : 'black';
  ctx.stroke();
}

function drawCircle(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.stroke();
}

function drawPanel(x, y, width, height, color) {
  const borderRadius = width / 10;

  ctx.fillStyle = colors[4];
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color || colors[1];
  ctx.fillRect(x + borderRadius, y + borderRadius, width - 2 * borderRadius, height - 2 * borderRadius);
}


// Event listeners
window.addEventListener('mousemove',
  function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
)

window.addEventListener('resize', 
  function() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  }
)

window.addEventListener('click',
  function() {
    gameboard.clicked();
  }
)

window.addEventListener('contextmenu', function(ev) {
  ev.preventDefault();
  gameboard.rightClicked();
  return false;
}, false)


function animate() {
  requestAnimationFrame(animate);
}


class Panel {
  constructor(x, y, width, color, type) {
    this.color = color,
    this.x = x,
    this.y = y,
    this.width = width,
    this.type = type || 0,
    this.flag = false,
    this.uncovered = false
  }

  draw() {
    let color = this.color;
    if (this.uncovered) {
      color = colors[0];
    }
    drawPanel(this.x, this.y, this.width, this.width, color);
    // Symbols
    if (this.flag) {
      this.drawSymbol("F");
    } else if (this.uncovered && this.type !== 0) {
      this.drawSymbol(this.type);
    }
  }

  drawSymbol(symbol) {
    ctx.fillStyle = "#000000";
    ctx.font = "24px Arial";
    ctx.fillText(symbol, this.x + 15, this.y + this.width - 15);
  }

  toggleFlag() {
    this.flag = !this.flag;
    this.draw();
  }

  reset() {
    this.type = 0;
    this.flag = false;
    this.uncovered = false;
    this.draw();
  }

  pressed() {
    this.uncovered = true;
    this.draw();
  }
}

class GameBoard {
  constructor(rows, columns, panelWidth, bombs) {
    this.panelWidth = panelWidth;
    this.columns = columns;
    this.rows = rows;
    this.panelColor = colors[1];
    this.panelsUncovered = 0;

    this.board = [];
    this.bombIndex = [];
    this.gameOver = false;

    this.generateBoard(this.panelWidth, bombs);
  }

  generateBoard(panelWidth, bombs) {
    const bombIDs = [];
    // Generate Bombs
    for (let i = 0; i < bombs; i++) {
      const totalPanels = this.columns * this.rows;
      const bombID = Math.floor(Math.random()* totalPanels);
      if (!bombIDs.includes(bombID)) {
        bombIDs.push(bombID);
      }
    }

    // Generate Panels + Bombs
    let counter = 0;
    for (let i = 1; i < this.columns + 1; i++) {
      const canvasX = i * panelWidth;
      for (var j = 1; j < this.rows + 1; j++) {
        
        const canvasY = j * panelWidth;
        let panel = null;
        if (bombIDs.includes(counter)) {
          this.bombIndex.push({x: i, y: j});
          panel = new Panel(canvasX, canvasY, panelWidth, this.panelColor, "B");
        } else {
          panel = new Panel(canvasX, canvasY, panelWidth, this.panelColor);
        }
        this.board.push({x: i, y: j, panel});
        counter ++;
      }
    }

    // Label Panels
    for (let i = 0; i < this.board.length; i++) {
      const panel = this.board[i].panel;
      if (panel.type !== "B") {
        panel.type = this.countBombs(this.getAdjacentPanels(i));
      }
    }
  }

  clicked() {
    if (this.gameOver) {
        this.resetBoard();
    } else {
      for (let i = 0; i < this.board.length; i++) {
        const panel = this.board[i].panel;
        if (
          mouse.x > panel.x &&
          mouse.x < panel.x + panel.width &&
          mouse.y > panel.y &&
          mouse.y < panel.y + panel.width
        ) {
          if (panel.flag || panel.uncovered) {
            return;
          }
          this.pressPanel(i);

          if (this.panelsUncovered === this.board.length - this.bombIndex.length) {
            this.handleWin();
          }
        }
      }
    }
  }

  pressPanel(index) {
    const panel = this.board[index].panel;
    panel.pressed();
    if (panel.type === "B") {
      this.handleGameOver();
      return;
    }
    this.panelsUncovered ++;
    if (panel.type === 0) {
      this.uncoverPanels(this.getAdjacentPanels(index));
    }
  }

  rightClicked() {
    for (let i = 0; i < this.board.length; i++) {
      const panel = this.board[i].panel;
      if (
        mouse.x > panel.x &&
        mouse.x < panel.x + panel.width &&
        mouse.y > panel.y &&
        mouse.y < panel.y + panel.width
      ) {
        if (panel.uncovered !== true) {
          panel.toggleFlag();
        }
      }
    }
  }

  getAdjacentPanels(boardIndex) {
    const topLeft = boardIndex - this.rows - 1;
    const top = boardIndex - 1;
    const topRight = boardIndex + this.rows -1;
    const left = boardIndex - this.rows;
    const right = boardIndex + this.rows;
    const bottomLeft = boardIndex - this.rows + 1;
    const bottom = boardIndex + 1;
    const bottomRight = boardIndex + this.rows + 1;

    let adjacentPanels = [topLeft, top, topRight, left, right, bottomLeft, bottom, bottomRight];

    // If top row
    if (boardIndex % this.rows === 0) {
      adjacentPanels = [left, right, bottomLeft, bottom, bottomRight];
      // If bottom row
    } else if (boardIndex % this.rows - (this.rows - 1) === 0) {
      adjacentPanels = [topLeft, top, topRight, left, right];
    }
    return(adjacentPanels);
  }

  uncoverPanels(panels) {
    for (let i = 0; i < panels.length; i++) {
      const panel = this.board[panels[i]];
      if (panel) {
        if (!panel.panel.uncovered) {
          this.pressPanel(panels[i]);
        }
      }
    }
  }

  resetBoard() {
    this.gameOver = false;
    for (let i = 0; i < this.board.length; i++) {
      this.board[i].panel.reset();
    }
    this.board = [];
    this.bombIndex = [];
    this.panelsUncovered = 0;
    this.generateBoard(panelWidth, bombs);
  }

  handleGameOver() {
    this.gameOver = true;
    ctx.fillStyle = "#000000";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", this.columns * this.panelWidth / 3, this.rows * this.panelWidth / 3);
  }

  handleWin() {
    this.gameOver = true;
    ctx.fillStyle = "#000000";
    ctx.font = "48px Arial";
    ctx.fillText("GAME WON", this.columns * this.panelWidth / 3, this.rows * this.panelWidth / 3);
  }

  countBombs(panels) {
    let count = 0;
    for (let i = 0; i < panels.length; i++) {
      const panel = this.board[panels[i]];
      if (panel) {
        if (panel.panel.type === "B") {
          count ++;
        }
      }
    }
    return(count);
  }

  draw() {
    for (let i = 0; i < this.board.length; i++) {
      this.board[i].panel.draw();
    }
  }

}

const panelWidth = 50;
const bombs = 40;

const gameboard = new GameBoard(10, 20, panelWidth, bombs);

function init() {
  gameboard.draw();
}


init();

