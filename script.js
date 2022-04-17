const API_HOST = "http://localhost:8000";
const INPUT_ENDPOINT = "/input";
const MOVE_ENDPOINT = API_HOST + "/move";
const START_ENDPOINT = API_HOST + "/start";
const DRAW_RANDOM_ENDPOINT = API_HOST + "/drawRandom";

var max_x = 1000;
var max_y = max_x;

var num_squares = 20;

var square_size = max_x / num_squares;

function drawTree(context, point, src) {
  var image = new Image();
  image.onload = () => {
    context.drawImage(
      image,
      point.x * square_size,
      point.y * square_size,
      square_size,
      square_size
    );
  };
  image.src = src;
}

function updateScore(scoreElement, score) {
  scoreElement.textContent = score;
}

function drawSquare(context, x, y) {
  var start_x = x * square_size;
  var start_y = y * square_size;
  context.fillRect(start_x, start_y, square_size, square_size);
}

function clearSquare(context, x, y) {
  var start_x = x * square_size;
  var start_y = y * square_size;
  context.clearRect(start_x, start_y, square_size, square_size);
}

function drawSquares(context, points) {
  points.map((p) => drawSquare(context, p.x, p.y));
}

function clearSquares(context, points) {
  points.map((p) => clearSquare(context, p.x, p.y));
}

function drawImageSquares(context, points, src) {
  points.map((p) => drawTree(context, p, src));
}

var inputCanvas = document.getElementById("canvas");
var canvasContext = inputCanvas.getContext("2d");

function setStyle(canvas, fillStyle) {
  canvas.fillStyle = fillStyle;
}

var round_fn_timeout;

var activeGame;

var scoreElement = document.getElementById("score");

canvasContext.beginPath();
canvasContext.rect(0, 0, max_x, max_y);
canvasContext.stroke();

function startGame(canvasContext, scoreElement) {
  fetch(START_ENDPOINT, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((json) => {
      renderFullBoard(canvasContext, json["board"]);
      updateScore(scoreElement, json["score"]);
      drawImageSquares(canvasContext, json["board"]["trees"], "tree.png");
      prev_tree = json["board"]["trees"];
      round_fn_timeout = setTimeout(
        () => cycle(json, canvasContext, scoreElement),
        playerInputSpeed
      );
    });
}

function renderFullBoard(canvasContext, board) {
  clearSquares(canvasContext, prev_snake);
  clearSquares(canvasContext, prev_food);
  prev_snake = board["snakeBody"];
  prev_food = board["activeFood"];
  setStyle(canvasContext, "black");
  drawSquares(canvasContext, board["snakeBody"]);
  setStyle(canvasContext, "green");
  drawSquares(canvasContext, board["activeFood"]);
}

function cycle(game, canvasContext, scoreElement) {
  console.log(playerInputs);
  game.input = playerInputs[0];
  if (playerInputs.length > 1) {
    playerInputs = playerInputs.splice(1);
  }

  fetch(MOVE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(game),
  })
    .then((res) => res.json())
    .then((json) => {
      activeGame = json;
      renderFullBoard(canvasContext, json["board"]);
      updateScore(scoreElement, json["board"]["score"]);
      clearTimeout(round_fn_timeout);
      if (!json["board"]["active"]) {
        alert("You lose! Final score: " + json["board"]["score"]);
        window.removeEventListener("keydown", keyDown);
      } else {
        round_fn_timeout = setTimeout(
          () => cycle(activeGame, canvasContext, scoreElement),
          playerInputSpeed
        );
      }
    });
}

function restart(canvasContext, scoreElement) {
  clearTimeout(round_fn_timeout);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  clearSquares(canvasContext, prev_snake);
  clearSquares(canvasContext, prev_food);
  clearSquares(canvasContext, prev_tree);
  prev_snake = [];
  prev_food = [];

  playerInputSpeed = NORMAL_SPEED;
  playerInputs = [];
  playerInputs.push("RIGHT");

  startGame(canvasContext, scoreElement);
}
var button = document.getElementById("restart");

button.onclick = () => restart(canvasContext, scoreElement);

var playerInputs;
var playerInputSpeed;

var prev_snake = [];
var prev_food = [];
var prev_tree = [];

var NORMAL_SPEED = 300;
var TURBO_SPEED = 100;

var keyToActionMap = {
  w: "DOWN",
  a: "LEFT",
  s: "UP",
  d: "RIGHT",
};

var keyDown = function (e) {
  if (e.key == " ") {
    playerInputSpeed = TURBO_SPEED;
  } else if (e.key in keyToActionMap) {
    if (keyToActionMap[e.key] != playerInputs[playerInputs.length - 1])
      playerInputs.push(keyToActionMap[e.key]);
  }
};

var keyUp = function (e) {
  if (e.key == " ") {
    playerInputSpeed = NORMAL_SPEED;
  }
};

// setInterval(() => refreshBoard(snakeCanvasContext, foodCanvasContext, scoreElement), 500);
