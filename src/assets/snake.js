/* snake.js - Adapté pour l'import Vue */
export class SnakeGame {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        if (!this.container) {
            console.error('SnakeGame: Container not found');
            return;
        }

        this.options = {
            gridSize: 20,
            speed: 100, // ms per tick
            canvasWidth: 600,
            canvasHeight: 400,
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.scoreElement = document.getElementById('term-score'); 
        this.overlay = null;
        this.overlayMessage = null;
        this.overlayBtn = null;

        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.rafId = null;
        this.isGameOver = false;
        this.hasStarted = false;
        
        this.eatAnim = 0; 

        this.init();
    }

    init() {
        this.container.classList.add('snake-game-container');
        this.container.innerHTML = `
            <canvas class="snake-canvas" width="${this.options.canvasWidth}" height="${this.options.canvasHeight}" tabindex="0"></canvas>
            <div class="snake-overlay">
                <div class="snake-message">System Ready</div>
                <button class="snake-btn">./start_game.sh</button>
            </div>
        `;

        this.canvas = this.container.querySelector('.snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        // On re-cherche l'élément score au cas où il aurait changé
        this.scoreElement = document.getElementById('term-score');
        
        this.overlay = this.container.querySelector('.snake-overlay');
        this.overlayMessage = this.container.querySelector('.snake-message');
        this.overlayBtn = this.container.querySelector('.snake-btn');

        this.overlayBtn.addEventListener('click', () => this.startGame());
        this.canvas.addEventListener('keydown', (e) => this.handleInput(e));
        
        // Prevent scrolling
        this.canvas.addEventListener('keydown', function(e) {
            if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
                e.preventDefault();
            }
        }, false);

        this.resetGame();
        this.draw(1); 
    }

    resetGame() {
        this.snake = [
            { x: 5, y: 10, prevX: 5, prevY: 10 },
            { x: 4, y: 10, prevX: 4, prevY: 10 },
            { x: 3, y: 10, prevX: 3, prevY: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.updateScore();
        this.isGameOver = false;
        this.hasStarted = false;
        this.eatAnim = 0;
        this.spawnFood();
    }

    startGame() {
        this.resetGame();
        this.hasStarted = true;
        this.overlay.classList.add('hidden');
        this.canvas.focus();
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    gameLoop(currentTime) {
        if (!this.hasStarted || this.isGameOver) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += deltaTime;

        while (this.accumulator >= this.options.speed) {
            this.update();
            this.accumulator -= this.options.speed;
        }

        const alpha = this.accumulator / this.options.speed;
        this.draw(alpha);

        this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    gameOver() {
        cancelAnimationFrame(this.rafId);
        this.isGameOver = true;
        this.overlayMessage.textContent = 'Segmentation Fault'; 
        this.overlayBtn.textContent = './retry.sh';
        this.overlay.classList.remove('hidden');
    }

    spawnFood() {
        const cols = this.options.canvasWidth / this.options.gridSize;
        const rows = this.options.canvasHeight / this.options.gridSize;
        
        let validPosition = false;
        while (!validPosition) {
            this.food = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows)
            };
            validPosition = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
    }

    handleInput(e) {
        if (!this.hasStarted) return;

        switch(e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
        }
    }

    update() {
        this.direction = this.nextDirection;

        const head = { ...this.snake[0] };
        head.prevX = head.x;
        head.prevY = head.y;

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        const cols = this.options.canvasWidth / this.options.gridSize;
        const rows = this.options.canvasHeight / this.options.gridSize;

        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
            this.gameOver();
            return;
        }

        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        for (let i = 0; i < this.snake.length; i++) {
            this.snake[i].prevX = this.snake[i].x;
            this.snake[i].prevY = this.snake[i].y;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.spawnFood();
            this.eatAnim = 1; 
        } else {
            this.snake.pop();
        }
        
        if (this.eatAnim > 0) this.eatAnim -= 0.1;
        if (this.eatAnim < 0) this.eatAnim = 0;
    }

    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    draw(alpha) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const gridSize = this.options.gridSize;

        // Draw Grid 
        this.ctx.fillStyle = '#003300'; 
        for (let x = 0; x <= this.options.canvasWidth; x += gridSize) {
            for (let y = 0; y <= this.options.canvasHeight; y += gridSize) {
                this.ctx.fillRect(x-1, y-1, 2, 2);
            }
        }

        // Draw Food 
        const fx = this.food.x * gridSize + gridSize / 2;
        const fy = this.food.y * gridSize + gridSize / 2;
        const fSize = gridSize * 0.8;
        const halfF = fSize / 2;
        const qSize = fSize / 2 - 1;

        this.ctx.save();
        this.ctx.translate(fx, fy);
        
        this.ctx.fillStyle = '#f25022'; this.ctx.fillRect(-halfF, -halfF, qSize, qSize);
        this.ctx.fillStyle = '#7fba00'; this.ctx.fillRect(1, -halfF, qSize, qSize);
        this.ctx.fillStyle = '#00a4ef'; this.ctx.fillRect(-halfF, 1, qSize, qSize);
        this.ctx.fillStyle = '#ffb900'; this.ctx.fillRect(1, 1, qSize, qSize);
        
        this.ctx.restore();

        // Draw Snake Body
        this.ctx.fillStyle = '#00ff00'; 
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#00ff00';
        
        for (let i = 1; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const ix = this.lerp(segment.prevX, segment.x, alpha);
            const iy = this.lerp(segment.prevY, segment.y, alpha);
            
            this.ctx.fillRect(
                ix * gridSize + 1, 
                iy * gridSize + 1, 
                gridSize - 2, 
                gridSize - 2
            );
        }
        this.ctx.shadowBlur = 0; 

        // Draw Head (Tux)
        const head = this.snake[0];
        const hx = this.lerp(head.prevX, head.x, alpha) * gridSize + gridSize / 2;
        const hy = this.lerp(head.prevY, head.y, alpha) * gridSize + gridSize / 2;
        
        this.ctx.save();
        this.ctx.translate(hx, hy);
        
        let angle = 0;
        if (this.direction === 'up') angle = -Math.PI / 2;
        if (this.direction === 'down') angle = Math.PI / 2;
        if (this.direction === 'left') angle = Math.PI;
        this.ctx.rotate(angle);

        if (this.eatAnim > 0) {
            const scale = 1 + (this.eatAnim * 0.3);
            this.ctx.scale(scale, scale);
        }

        // Draw Tux (Simplified)
        const size = gridSize * 1.2;
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size/2, size/2.2, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.ellipse(0, size/6, size/3, size/3.5, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.ellipse(-size/5, -size/5, size/8, size/6, 0, 0, Math.PI*2);
        this.ctx.ellipse(size/5, -size/5, size/8, size/6, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-size/5 + 1, -size/5, 2, 0, Math.PI*2);
        this.ctx.arc(size/5 - 1, -size/5, 2, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.moveTo(-size/6, 0);
        this.ctx.lineTo(size/6, 0);
        this.ctx.lineTo(0, size/4);
        this.ctx.fill();

        this.ctx.restore();
    }
    
    // Ajout d'une méthode destroy pour nettoyer si besoin
    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }
}