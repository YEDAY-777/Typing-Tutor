# from flask import Flask, render_template, jsonify, request
# import random
# import json
# import os
#
# app = Flask(__name__)
#
# # 游戏状态
# class SnakeGame:
#     def __init__(self):
#         self.reset()
#
#     def reset(self):
#         self.snake = [(12, 12)]  # 蛇的初始位置（25x25的中心）
#         self.food = self.generate_food()
#         self.direction = 'RIGHT'
#         self.score = 0
#         self.game_over = False
#         self.grid_size = 25  # 修改为25
#
#     def generate_food(self):
#         while True:
#             food = (random.randint(0, 24), random.randint(0, 24))  # 0-24
#             if food not in self.snake:
#                 return food
#
#     def move(self):
#         if self.game_over:
#             return
#
#         head = self.snake[0]
#         if self.direction == 'UP':
#             new_head = (head[0], head[1] - 1)
#         elif self.direction == 'DOWN':
#             new_head = (head[0], head[1] + 1)
#         elif self.direction == 'LEFT':
#             new_head = (head[0] - 1, head[1])
#         elif self.direction == 'RIGHT':
#             new_head = (head[0] + 1, head[1])
#
#         # 检查边界和自身碰撞
#         if (new_head[0] < 0 or new_head[0] >= self.grid_size or
#                 new_head[1] < 0 or new_head[1] >= self.grid_size or
#                 new_head in self.snake):
#             self.game_over = True
#             return
#
#         # 移动蛇
#         self.snake.insert(0, new_head)
#
#         # 检查是否吃到食物
#         if new_head == self.food:
#             self.score += 10
#             self.food = self.generate_food()
#         else:
#             self.snake.pop()
#
#     def change_direction(self, new_direction):
#         # 防止直接反向移动
#         opposites = {'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'}
#         if new_direction != opposites.get(self.direction):
#             self.direction = new_direction
#
#
# game = SnakeGame()
#
#
# @app.route('/')
# def index():
#     """游戏主页面"""
#     return '''
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <title>在线贪吃蛇游戏</title>
#         <style>
#             body {
#                 font-family: Arial, sans-serif;
#                 text-align: center;
#                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
#                 margin: 0;
#                 padding: 20px;
#                 min-height: 100vh;
#                 color: white;
#             }
#
#             .game-container {
#                 max-width: 800px;
#                 margin: 0 auto;
#                 padding: 20px;
#                 background: rgba(255, 255, 255, 0.1);
#                 backdrop-filter: blur(10px);
#                 border-radius: 15px;
#                 box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
#             }
#
#             h1 {
#                 color: #fff;
#                 margin-bottom: 10px;
#                 text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
#             }
#
#             .game-info {
#                 display: flex;
#                 justify-content: center;
#                 gap: 30px;
#                 margin: 20px 0;
#                 font-size: 1.2em;
#             }
#
#             #game-board {
#                 display: grid;
#                 grid-template-columns: repeat(25, 1fr);  /* 25列 */
#                 grid-template-rows: repeat(25, 1fr);     /* 25行 */
#                 width: 400px;
#                 height: 400px;
#                 margin: 20px auto;
#                 border: 3px solid #fff;
#                 background: #2c3e50;
#                 box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
#             }
#
#             .cell {
#                 width: 100%;
#                 height: 100%;
#                 box-sizing: border-box;
#             }
#
#             .snake {
#                 background: #00ff88;
#                 border-radius: 3px;
#                 box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.5);
#             }
#
#             .snake-head {
#                 background: #00cc66;
#                 border-radius: 5px;
#             }
#
#             .food {
#                 background: #ff4757;
#                 border-radius: 50%;
#                 animation: pulse 1s infinite;
#             }
#
#             @keyframes pulse {
#                 0% { transform: scale(1); }
#                 50% { transform: scale(1.2); }
#                 100% { transform: scale(1); }
#             }
#
#             .controls {
#                 margin: 20px 0;
#             }
#
#             button {
#                 background: #3498db;
#                 color: white;
#                 border: none;
#                 padding: 12px 25px;
#                 margin: 5px;
#                 border-radius: 25px;
#                 font-size: 1em;
#                 cursor: pointer;
#                 transition: all 0.3s;
#                 box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
#             }
#
#             button:hover {
#                 background: #2980b9;
#                 transform: translateY(-2px);
#                 box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
#             }
#
#             .control-keys {
#                 margin-top: 20px;
#                 display: grid;
#                 grid-template-columns: repeat(3, 60px);
#                 grid-template-rows: repeat(2, 60px);
#                 gap: 10px;
#                 justify-content: center;
#             }
#
#             .key {
#                 background: rgba(255, 255, 255, 0.2);
#                 border: 2px solid white;
#                 border-radius: 10px;
#                 display: flex;
#                 align-items: center;
#                 justify-content: center;
#                 font-size: 1.5em;
#                 cursor: pointer;
#                 user-select: none;
#                 transition: all 0.2s;
#             }
#
#             .key:hover {
#                 background: rgba(255, 255, 255, 0.3);
#             }
#
#             .key:active {
#                 transform: scale(0.95);
#             }
#
#             #game-over {
#                 position: fixed;
#                 top: 0;
#                 left: 0;
#                 width: 100%;
#                 height: 100%;
#                 background: rgba(0, 0, 0, 0.8);
#                 display: none;
#                 justify-content: center;
#                 align-items: center;
#                 z-index: 1000;
#             }
#
#             .game-over-content {
#                 background: white;
#                 padding: 40px;
#                 border-radius: 15px;
#                 text-align: center;
#                 color: #333;
#             }
#
#             .instructions {
#                 background: rgba(255, 255, 255, 0.1);
#                 padding: 15px;
#                 border-radius: 10px;
#                 margin: 20px auto;
#                 max-width: 400px;
#             }
#         </style>
#     </head>
#     <body>
#         <div class="game-container">
#             <h1>🐍 在线贪吃蛇游戏</h1>
#
#             <div class="game-info">
#                 <div>得分: <span id="score">0</span></div>
#                 <div>长度: <span id="length">1</span></div>
#             </div>
#
#             <div id="game-board"></div>
#
#             <div class="instructions">
#                 使用方向键或WASD控制蛇的移动<br>
#                 尽可能多吃食物，不要撞到墙壁或自己的身体！
#             </div>
#
#             <div class="controls">
#                 <button onclick="resetGame()">重新开始</button>
#                 <button onclick="pauseGame()" id="pause-btn">暂停游戏</button>
#             </div>
#
#             <div class="control-keys">
#                 <div></div>
#                 <div class="key" onclick="changeDirection('UP')">↑</div>
#                 <div></div>
#                 <div class="key" onclick="changeDirection('LEFT')">←</div>
#                 <div class="key" onclick="changeDirection('DOWN')">↓</div>
#                 <div class="key" onclick="changeDirection('RIGHT')">→</div>
#             </div>
#         </div>
#
#         <div id="game-over">
#             <div class="game-over-content">
#                 <h2>游戏结束!</h2>
#                 <p>最终得分: <span id="final-score">0</span></p>
#                 <button onclick="resetGame()">再玩一次</button>
#             </div>
#         </div>
#
#         <script>
#         // 在脚本开头添加
# let pendingDirection = null;
#
# // 修改键盘控制函数
# document.addEventListener('keydown', (e) => {
#     switch(e.key) {
#         case 'ArrowUp':
#         case 'w':
#         case 'W':
#             pendingDirection = 'UP';
#             break;
#         case 'ArrowDown':
#         case 's':
#         case 'S':
#             pendingDirection = 'DOWN';
#             break;
#         case 'ArrowLeft':
#         case 'a':
#         case 'A':
#             pendingDirection = 'LEFT';
#             break;
#         case 'ArrowRight':
#         case 'd':
#         case 'D':
#             pendingDirection = 'RIGHT';
#             break;
#         case ' ':
#             pauseGame();
#             break;
#     }
#     e.preventDefault(); // 防止默认行为
# });
# 
# // 修改开始游戏函数
# function startGame() {
#     if (gameInterval) clearInterval(gameInterval);
#     gameInterval = setInterval(() => {
#         if (!isPaused) {
#             // 应用待处理的方向改变
#             if (pendingDirection) {
#                 changeDirection(pendingDirection);
#                 pendingDirection = null;
#             }
#             fetch('/move', {method: 'POST'})
#                 .then(() => getGameState());
#         }
#     }, 150); // 稍微加快游戏速度
# }
#             let gameInterval;
#             let isPaused = false;
#
#             // 初始化游戏板
#             function initBoard() {
#                 const board = document.getElementById('game-board');
#                 board.innerHTML = '';
#                 for (let i = 0; i < 625; i++) {  // 25x25=625
#                     const cell = document.createElement('div');
#                     cell.className = 'cell';
#                     cell.id = `cell-${i}`;
#                     board.appendChild(cell);
#                 }
#             }
#
#             // 绘制游戏
#             function drawGame(data) {
#                 // 清除所有单元格
#                 document.querySelectorAll('.cell').forEach(cell => {
#                     cell.className = 'cell';
#                 });
#
#                 // 绘制蛇 - 修改这里！
#                 data.snake.forEach((segment, index) => {
#                     const cellId = segment[1] * 25 + segment[0];  // 20改为25
#                     const cell = document.getElementById(`cell-${cellId}`);
#                     if (cell) {
#                         cell.classList.add(index === 0 ? 'snake-head' : 'snake');
#                     }
#                 });
#
#                 // 绘制食物 - 修改这里！
#                 const foodId = data.food[1] * 25 + data.food[0];  // 20改为25
#                 const foodCell = document.getElementById(`cell-${foodId}`);
#                 if (foodCell) {
#                     foodCell.classList.add('food');
#                 }
#
#                 // 更新分数和长度
#                 document.getElementById('score').textContent = data.score;
#                 document.getElementById('length').textContent = data.snake.length;
#
#                 // 检查游戏结束
#                 if (data.game_over) {
#                     clearInterval(gameInterval);
#                     document.getElementById('final-score').textContent = data.score;
#                     document.getElementById('game-over').style.display = 'flex';
#                 }
#             }
#
#             // 获取游戏状态
#             function getGameState() {
#                 fetch('/game_state')
#                     .then(response => response.json())
#                     .then(data => {
#                         drawGame(data);
#                     });
#             }
#
#             // 改变方向
#             function changeDirection(direction) {
#                 fetch('/change_direction', {
#                     method: 'POST',
#                     headers: {
#                         'Content-Type': 'application/json',
#                     },
#                     body: JSON.stringify({direction: direction})
#                 });
#             }
#
#             // 重置游戏
#             function resetGame() {
#                 fetch('/reset', {
#                     method: 'POST'
#                 }).then(() => {
#                     document.getElementById('game-over').style.display = 'none';
#                     if (isPaused) {
#                         pauseGame(); // 解除暂停
#                     }
#                     startGame();
#                 });
#             }
#
#             // 暂停游戏
#             function pauseGame() {
#                 isPaused = !isPaused;
#                 const btn = document.getElementById('pause-btn');
#                 if (isPaused) {
#                     clearInterval(gameInterval);
#                     btn.textContent = '继续游戏';
#                 } else {
#                     startGame();
#                     btn.textContent = '暂停游戏';
#                 }
#             }
#
#             // 开始游戏
#             function startGame() {
#                 if (gameInterval) clearInterval(gameInterval);
#                 gameInterval = setInterval(() => {
#                     if (!isPaused) {
#                         fetch('/move', {method: 'POST'})
#                             .then(() => getGameState());
#                     }
#                 }, 200);
#             }
#
#             // 键盘控制
#             document.addEventListener('keydown', (e) => {
#                 switch(e.key) {
#                     case 'ArrowUp':
#                     case 'w':
#                     case 'W':
#                         changeDirection('UP');
#                         break;
#                     case 'ArrowDown':
#                     case 's':
#                     case 'S':
#                         changeDirection('DOWN');
#                         break;
#                     case 'ArrowLeft':
#                     case 'a':
#                     case 'A':
#                         changeDirection('LEFT');
#                         break;
#                     case 'ArrowRight':
#                     case 'd':
#                     case 'D':
#                         changeDirection('RIGHT');
#                         break;
#                     case ' ':
#                         pauseGame();
#                         break;
#                 }
#             });
#
#             // 初始化
#             initBoard();
#             startGame();
#             getGameState();
#         </script>
#     </body>
#     </html>
#     '''
#
#
# @app.route('/game_state')
# def game_state():
#     """获取游戏状态"""
#     return jsonify({
#         'snake': game.snake,
#         'food': game.food,
#         'score': game.score,
#         'game_over': game.game_over
#     })
#
#
# @app.route('/move', methods=['POST'])
# def move():
#     """移动蛇"""
#     game.move()
#     return jsonify({'success': True})
#
#
# @app.route('/change_direction', methods=['POST'])
# def change_direction():
#     """改变方向"""
#     data = request.get_json()
#     game.change_direction(data['direction'])
#     return jsonify({'success': True})
#
#
# @app.route('/reset', methods=['POST'])
# def reset():
#     """重置游戏"""
#     game.reset()
#     return jsonify({'success': True})
#
#
# if __name__ == '__main__':
#     # 在本地运行
#     print("游戏启动中...")
#     print("请在浏览器中访问: http://localhost:8081")
#     print("按 Ctrl+C 停止游戏")
#     app.run(debug=False, host='0.0.0.0', port=8081)