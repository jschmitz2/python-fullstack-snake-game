from typing import Optional, List
from enum import Enum
from urllib import response
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import copy
from pydantic import BaseModel

NUM_SQUARES = 20

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Direction(Enum):
    UP = "UP"
    RIGHT = "RIGHT"
    DOWN = "DOWN"
    LEFT = "LEFT"

class BoardPiece(BaseModel):
    x: int
    y: int 

    def move(self, input: Direction):
        if input == Direction.UP:
            self.y += 1
        elif input == Direction.RIGHT:
            self.x += 1
        elif input == Direction.DOWN:
            self.y -= 1
        elif input == Direction.LEFT:
            self.x -= 1

    def __eq__(self, o) -> bool:
        return self.x == o.x and self.y == o.y
        
class Board(BaseModel):
    snakeBody: List[BoardPiece]
    activeFood: List[BoardPiece]
    trees: List[BoardPiece]
    active: bool
    score: int

    def isAlreadyOccupied(self, newPiece):
        return newPiece in self.snakeBody or newPiece in self.activeFood or newPiece in self.trees

    def addFood(self):
        newPiece = BoardPiece(x=random.randint(0, NUM_SQUARES - 1), y=random.randint(0, NUM_SQUARES - 1))
        if self.isAlreadyOccupied(newPiece):
            self.addFood() # Try again! 
        else:
            self.activeFood.append(newPiece)

    def addTree(self):
        newPiece = BoardPiece(x=random.randint(0, NUM_SQUARES - 1), y=random.randint(1, NUM_SQUARES - 1))
        if self.isAlreadyOccupied(newPiece):
            self.addTree() # Try again! 
        else:
            self.trees.append(newPiece)

    def score(self):
        return len(self.snakeBody)

    def move(self, input: Direction): 
        # Are we munching or strolling?
        next = copy.deepcopy(self.snakeBody[-1])
        next.move(input)

        ##  Failure conditions 
        # 1. Eating ourself. 
        if next in self.snakeBody:
            # You lose! 
            self.active = False
        
        # 2. Going off the screen. 
        if next.x < 0 or next.x >= NUM_SQUARES:
            self.active = False
        if next.y < 0 or next.y >= NUM_SQUARES:
            self.active = False 

        # 3. Hitting a tree.
        if next in self.trees:
            self.active = False

        if not self.active:
            return
        
        if (next in self.activeFood):
            # Munching!
            # Don't move the snake. 
            self.snakeBody.append(next)
            self.activeFood.remove(next)
            self.addFood()
            self.score += 1
        else:
            # Strolling. 
            # Move the snake.
            self.snakeBody.append(next)
            del self.snakeBody[0]


class Game(BaseModel):
    board: Board
    input: Direction

    

@app.get("/drawRandom")
def read_root():
    game = Game()
    for _ in range(random.randint(0, NUM_SQUARES * 5)):
        newPiece = BoardPiece(random.randint(0, NUM_SQUARES - 1), random.randint(0, NUM_SQUARES - 1))
        game.addPiece(newPiece)
    return game

@app.post("/start")
def startGame():
    board = Board(snakeBody = [], activeFood = [], trees = [], score = 1, active = True)
    start = BoardPiece(x=0, y=0)
    for _ in range(NUM_SQUARES * 2):
        board.addFood()
        board.addTree()
    board.snakeBody.append(start)
    g = Game(board=board, input = Direction.RIGHT)
    return g

@app.post("/move")
def move(g: Game): 
    g.board.move(g.input)
    return g