// Juego Infinite Jump - Versión optimizada para Replit
class InfiniteJumpGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Estado del juego
        this.gameState = 'start';
        this.score = 0;
        this.coins = 0;
        this.level = 1;
        this.highScore = 0;
        this.diamondsCollected = 0;
        this.distanceCounter = 0;
        this.lastCoinDistance = 0;

        // Jugador
        this.player = {
            x: 0,
            y: 0,
            width: 35,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            color: '#00ffff',
            jumpForce: -13,
            speed: 7
        };

        // Power-ups
        this.powerUps = {
            boots: false,
            jetpack: false,
            jetpackCounter: 0
        };

        // Elementos del juego
        this.platforms = [];
        this.platformWidth = 90;
        this.platformHeight = 18;
        this.platformGap = 180;
        this.minPlatformGap = 140;
        this.maxPlatformGap = 350;

        this.diamonds = [];
        this.diamondSize = 22;

        // Configuración
        this.gravity = 0.4;
        this.scrollSpeed = 2.8;
        this.gameSpeed = 1;
        this.isMobile = false;

        // Controles
        this.keys = {
            left: false,
            right: false
        };

        // Animación
        this.animationId = null;
        this.lastTime = 0;

        // Inicializar
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.loadGameData();
        this.setupControls();
        this.setupUIEvents();
        this.checkMobile();
        this.showScreen('start');
        this.updatePreview();

        this.gameLoop();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        if (this.gameState === 'start') {
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
            this.player.y = this.canvas.height - 150;
        }
    }

    checkMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const mobileControls = document.querySelector('.mobile-controls');
        if (this.isMobile) {
            mobileControls.style.display = 'flex';
        }
    }

    setupControls() {
        // Teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === ' ' && this.gameState === 'playing') this.pauseGame();
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') this.pauseGame();
                else if (this.gameState === 'paused') this.resumeGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
        });

        // Controles móviles
        const leftControl = document.getElementById('left-control');
        const rightControl = document.getElementById('right-control');

        const startLeft = (e) => { e.preventDefault(); this.keys.left = true; };
        const endLeft = (e) => { e.preventDefault(); this.keys.left = false; };
        const startRight = (e) => { e.preventDefault(); this.keys.right = true; };
        const endRight = (e) => { e.preventDefault(); this.keys.right = false; };

        leftControl.addEventListener('touchstart', startLeft);
        leftControl.addEventListener('touchend', endLeft);
        leftControl.addEventListener('mousedown', startLeft);
        leftControl.addEventListener('mouseup', endLeft);
        leftControl.addEventListener('mouseleave', endLeft);

        rightControl.addEventListener('touchstart', startRight);
        rightControl.addEventListener('touchend', endRight);
        rightControl.addEventListener('mousedown', startRight);
        rightControl.addEventListener('mouseup', endRight);
        rightControl.addEventListener('mouseleave', endRight);

        // Toques en pantalla
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.gameState !== 'playing') return;
            const touchX = e.touches[0].clientX;
            if (touchX < window.innerWidth / 2) {
                this.keys.left = true;
                this.keys.right = false;
            } else {
                this.keys.right = true;
                this.keys.left = false;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.keys.left = false;
            this.keys.right = false;
        });
    }

    setupUIEvents() {
        // Navegación principal
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('open-shop').addEventListener('click', () => this.showScreen('shop'));
        document.getElementById('open-redeem').addEventListener('click', () => this.showRedeemScreen());
        document.getElementById('how-to-play').addEventListener('click', () => this.showScreen('tutorial'));

        // Cerrar pantallas
        document.getElementById('close-tutorial').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('close-shop').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('close-redeem').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('cancel-redeem').addEventListener('click', () => this.showScreen('start'));

        // Juego
        document.getElementById('pause-game').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-game').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-game').addEventListener('click', () => this.startGame());
        document.getElementById('quit-game').addEventListener('click', () => this.showScreen('start'));

        // Game over
        document.getElementById('play-again').addEventListener('click', () => this.startGame());
        document.getElementById('gameover-menu').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('gameover-shop').addEventListener('click', () => this.showScreen('shop'));

        // Tienda
        document.querySelectorAll('.btn-buy').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = e.target.closest('.shop-item').dataset.item;
                this.buyItem(item);
            });
        });

        // Canje
        document.getElementById('redeem-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.redeemPrize();
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.gameState = screenName;

        if (screenName === 'start') {
            this.updatePreview();
        } else if (screenName === 'shop') {
            this.updateShop();
        } else if (screenName === 'redeem') {
            this.updateRedeemScreen();
        }
    }

    updatePreview() {
        document.getElementById('preview-coins').textContent = this.coins;
        document.getElementById('preview-level').textContent = this.level;
        document.getElementById('preview-highscore').textContent = Math.floor(this.highScore);
    }

    updateShop() {
        document.getElementById('shop-coins').textContent = this.coins;

        const bootsStatus = document.getElementById('boots-status');
        const jetpackStatus = document.getElementById('jetpack-status');

        if (this.powerUps.boots) {
            bootsStatus.textContent = 'COMPRADO';
            bootsStatus.style.background = 'rgba(0, 255, 128, 0.2)';
            bootsStatus.style.color = '#00ff80';
            bootsStatus.style.borderColor = '#00ff80';
            const bootsBtn = document.querySelector('[data-item="boots"] .btn-buy');
            bootsBtn.textContent = 'COMPRADO';
            bootsBtn.classList.add('disabled');
            bootsBtn.disabled = true;
        }

        if (this.powerUps.jetpack) {
            jetpackStatus.textContent = 'COMPRADO';
            jetpackStatus.style.background = 'rgba(0, 255, 128, 0.2)';
            jetpackStatus.style.color = '#00ff80';
            jetpackStatus.style.borderColor = '#00ff80';
            const jetpackBtn = document.querySelector('[data-item="jetpack"] .btn-buy');
            jetpackBtn.textContent = 'COMPRADO';
            jetpackBtn.classList.add('disabled');
            jetpackBtn.disabled = true;
        }
    }

    updateRedeemScreen() {
        const progress = Math.min(this.coins, 1000);
        const progressPercent = (progress / 1000) * 100;

        document.getElementById('redeem-progress').style.width = `${progressPercent}%`;
        document.getElementById('redeem-count').textContent = `${progress}/1000`;

        if (this.coins >= 1000) {
            document.getElementById('redeem-locked').style.display = 'none';
            document.getElementById('redeem-unlocked').style.display = 'block';
        } else {
            document.getElementById('redeem-locked').style.display = 'block';
            document.getElementById('redeem-unlocked').style.display = 'none';
        }
    }

    showRedeemScreen() {
        this.updateRedeemScreen();
        this.showScreen('redeem');
    }

    startGame() {
        // Resetear juego
        this.score = 0;
        this.distanceCounter = 0;
        this.lastCoinDistance = 0;
        this.diamondsCollected = 0;
        this.platforms = [];
        this.diamonds = [];

        // Configurar nivel
        this.level = 1;
        this.platformGap = 180;
        this.gameSpeed = 1;

        // Posicionar jugador
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height - 150;
        this.player.velocityX = 0;
        this.player.velocityY = 0;

        // Aplicar power-ups
        this.player.jumpForce = this.powerUps.boots ? -16.9 : -13;
        this.powerUps.jetpackCounter = 0;

        // Crear plataforma inicial
        this.createInitialPlatform();

        // Actualizar UI
        this.updateGameUI();
        this.updatePowerUpIndicators();

        // Comenzar juego
        this.showScreen('game');
        this.gameState = 'playing';
    }

    createInitialPlatform() {
        const platform = {
            x: this.player.x + this.player.width / 2 - this.platformWidth / 2,
            y: this.player.y + this.player.height,
            width: this.platformWidth,
            height: this.platformHeight,
            color: '#00ffff'
        };
        this.platforms.push(platform);

        // Crear más plataformas
        for (let i = 1; i < 5; i++) {
            this.createPlatform(this.platforms[this.platforms.length - 1].y - this.platformGap);
        }
    }

    createPlatform(y) {
        const minX = 40;
        const maxX = this.canvas.width - this.platformWidth - 40;
        const x = Math.random() * (maxX - minX) + minX;

        const platform = {
            x: x,
            y: y,
            width: this.platformWidth,
            height: this.platformHeight,
            color: this.getPlatformColor()
        };

        this.platforms.push(platform);

        // 30% de probabilidad de diamante
        if (Math.random() < 0.3) {
            this.createDiamond(platform);
        }
    }

    createDiamond(platform) {
        const diamond = {
            x: platform.x + platform.width / 2 - this.diamondSize / 2,
            y: platform.y - this.diamondSize - 8,
            size: this.diamondSize,
            color: '#ff3366',
            collected: false
        };
        this.diamonds.push(diamond);
    }

    getPlatformColor() {
        const colors = ['#00ffff', '#0080ff', '#00ff80', '#ff00ff', '#ff8000'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateGameUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('level').textContent = this.level;
        document.getElementById('diamond-count').textContent = this.diamondsCollected;
    }

    updatePowerUpIndicators() {
        document.getElementById('boots-indicator').style.display = this.powerUps.boots ? 'flex' : 'none';
        document.getElementById('jetpack-indicator').style.display = this.powerUps.jetpack ? 'flex' : 'none';
    }

    buyItem(item) {
        let cost = 0;
        let itemName = '';

        switch(item) {
            case 'boots':
                if (this.powerUps.boots) return;
                cost = 100;
                itemName = 'Botas de Salto';
                break;
            case 'jetpack':
                if (this.powerUps.jetpack) return;
                cost = 250;
                itemName = 'Auto-Jetpack';
                break;
            default:
                return;
        }

        if (this.coins >= cost) {
            this.coins -= cost;
            this.powerUps[item] = true;
            this.saveGameData();
            this.updateShop();
            alert(`¡${itemName} comprado con éxito!`);
        } else {
            alert(`Necesitas ${cost} monedas. Tienes ${this.coins}.`);
        }
    }

    redeemPrize() {
        const playerId = document.getElementById('player-id').value.trim();

        if (!playerId) {
            alert('Por favor, ingresa tu ID de jugador.');
            return;
        }

        if (this.coins < 1000) {
            alert('No tienes suficientes monedas para canjear.');
            return;
        }

        // Generar ticket
        const ticketCode = 'TICKET-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();

        // Restar monedas
        this.coins -= 1000;
        this.saveGameData();

        // Crear mensaje de WhatsApp
        const message = `¡Hola! Quiero canjear mis monedas en Infinite Jump.%0A%0A` +
                       `ID del Jugador: ${playerId}%0A` +
                       `Juego: Infinite Jump%0A` +
                       `Código de Ticket: ${ticketCode}%0A` +
                       `Monedas canjeadas: 1000%0A` +
                       `Fecha: ${new Date().toLocaleDateString('es-ES')}`;

        const phoneNumber = '8496247911';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');

        // Mostrar confirmación
        alert(`¡Canje exitoso! Se han restado 1000 monedas. Código: ${ticketCode}`);

        // Volver al menú
        this.showScreen('start');
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pause-score').textContent = Math.floor(this.score) + ' m';
            document.getElementById('pause-coins').textContent = this.coins;
            this.showScreen('pause');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('game');
        }
    }

    gameOver() {
        this.gameState = 'gameover';

        // Verificar récord
        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.highScore = this.score;
        }

        // Actualizar pantalla
        document.getElementById('final-score').textContent = Math.floor(this.score) + ' m';
        document.getElementById('final-coins').textContent = this.coins;

        if (isNewRecord) {
            document.getElementById('new-record').style.display = 'block';
            document.getElementById('no-record').style.display = 'none';
        } else {
            document.getElementById('new-record').style.display = 'none';
            document.getElementById('no-record').style.display = 'block';
        }

        // Guardar
        this.saveGameData();

        // Mostrar pantalla
        this.showScreen('gameover');
    }

    updateGame(deltaTime) {
        if (this.gameState !== 'playing') return;

        // Movimiento horizontal
        if (this.keys.left) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys.right) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= 0.9;
        }

        // Gravedad
        this.player.velocityY += this.gravity;

        // Actualizar posición
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Límites horizontales
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.velocityX = 0;
        }
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
            this.player.velocityX = 0;
        }

        // Colisiones con plataformas
        let onPlatform = false;

        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];

            if (this.player.y + this.player.height <= platform.y + 5 &&
                this.player.y + this.player.height >= platform.y - 5 &&
                this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.velocityY > 0) {

                this.player.y = platform.y - this.player.height;
                this.player.velocityY = this.player.jumpForce;
                onPlatform = true;

                // Jetpack cada 3 plataformas
                if (this.powerUps.jetpack) {
                    this.powerUps.jetpackCounter++;
                    if (this.powerUps.jetpackCounter >= 3) {
                        this.player.velocityY = this.player.jumpForce * 1.5;
                        this.powerUps.jetpackCounter = 0;
                    }
                }

                break;
            }
        }

        // Colisiones con diamantes
        for (let i = this.diamonds.length - 1; i >= 0; i--) {
            const diamond = this.diamonds[i];

            if (!diamond.collected &&
                this.player.x < diamond.x + diamond.size &&
                this.player.x + this.player.width > diamond.x &&
                this.player.y < diamond.y + diamond.size &&
                this.player.y + this.player.height > diamond.y) {

                diamond.collected = true;
                this.diamondsCollected++;
                this.coins += 5;
                this.saveGameData();
                this.updateGameUI();
            }
        }

        // Actualizar distancia y puntuación
        const distanceDelta = this.scrollSpeed * this.gameSpeed * (deltaTime / 16);
        this.distanceCounter += distanceDelta;
        this.score = this.distanceCounter / 10;

        // Recompensa por distancia (cada 100 metros = 2 monedas)
        const currentDistanceInMeters = Math.floor(this.score);
        if (currentDistanceInMeters >= this.lastCoinDistance + 100) {
            const coinsEarned = Math.floor((currentDistanceInMeters - this.lastCoinDistance) / 100) * 2;
            this.coins += coinsEarned;
            this.lastCoinDistance = currentDistanceInMeters - (currentDistanceInMeters % 100);
            this.saveGameData();
            this.updateGameUI();
        }

        // Actualizar nivel y dificultad
        this.updateLevel();

        // Desplazar plataformas
        this.scrollPlatforms(distanceDelta);

        // Verificar game over
        if (this.player.y > this.canvas.height + 100) {
            this.gameOver();
        }

        // Generar nuevas plataformas
        this.generatePlatforms();
    }

    scrollPlatforms(deltaY) {
        for (let i = 0; i < this.platforms.length; i++) {
            this.platforms[i].y += deltaY;
        }

        for (let i = 0; i < this.diamonds.length; i++) {
            this.diamonds[i].y += deltaY;
        }

        this.player.y -= deltaY;
    }

    updateLevel() {
        const newLevel = Math.floor(this.score / 500) + 1;

        if (newLevel > this.level) {
            this.level = newLevel;
            this.platformGap = Math.min(
                this.minPlatformGap + (this.level - 1) * 18,
                this.maxPlatformGap
            );
            this.gameSpeed = 1 + (this.level - 1) * 0.08;
            this.updateGameUI();
        }
    }

    generatePlatforms() {
        // Eliminar elementos fuera de pantalla
        this.platforms = this.platforms.filter(platform => platform.y < this.canvas.height + 100);
        this.diamonds = this.diamonds.filter(diamond => diamond.y < this.canvas.height + 100 && !diamond.collected);

        // Generar nuevas plataformas
        const lowestPlatform = Math.min(...this.platforms.map(p => p.y));
        if (lowestPlatform > this.platformGap) {
            this.createPlatform(-40);
        }
    }

    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = 'rgba(10, 10, 40, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar fondo
        this.drawBackground();

        // Dibujar plataformas
        this.platforms.forEach(platform => {
            this.ctx.shadowColor = platform.color;
            this.ctx.shadowBlur = 12;

            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 2);

            this.ctx.shadowBlur = 0;
        });

        // Dibujar diamantes
        this.diamonds.forEach(diamond => {
            if (!diamond.collected) {
                this.ctx.shadowColor = '#ff3366';
                this.ctx.shadowBlur = 15;

                this.ctx.fillStyle = diamond.color;
                this.ctx.beginPath();
                this.ctx.moveTo(diamond.x + diamond.size / 2, diamond.y);
                this.ctx.lineTo(diamond.x + diamond.size, diamond.y + diamond.size / 2);
                this.ctx.lineTo(diamond.x + diamond.size / 2, diamond.y + diamond.size);
                this.ctx.lineTo(diamond.x, diamond.y + diamond.size / 2);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fillRect(diamond.x + diamond.size / 3, diamond.y + diamond.size / 4, 3, 3);
                this.ctx.fillRect(diamond.x + diamond.size * 2/3 - 3, diamond.y + diamond.size / 2, 3, 3);

                this.ctx.shadowBlur = 0;
            }
        });

        // Dibujar jugador
        this.drawPlayer();
    }

    drawBackground() {
        // Fondo degradado
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(20, 20, 60, 0.8)');
        gradient.addColorStop(1, 'rgba(10, 10, 30, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Estrellas
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 40; i++) {
            const x = (i * 47) % this.canvas.width;
            const y = (i * 29) % this.canvas.height;
            const size = Math.sin(Date.now() / 1200 + i) * 1.5 + 1.5;

            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPlayer() {
        // Efecto neón
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 15;

        // Cuerpo
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Detalles
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Ojos
        this.ctx.fillRect(this.player.x + 8, this.player.y + 12, 6, 6);
        this.ctx.fillRect(this.player.x + this.player.width - 14, this.player.y + 12, 6, 6);

        // Sonrisa
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + 28, 8, 0.2, Math.PI - 0.2);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime || 0;
        this.lastTime = currentTime;

        if (this.gameState === 'playing') {
            this.updateGame(deltaTime);
        }

        this.draw();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    saveGameData() {
        const gameData = {
            coins: this.coins,
            level: this.level,
            highScore: this.highScore,
            powerUps: this.powerUps
        };
        localStorage.setItem('infiniteJumpData', JSON.stringify(gameData));
    }

    loadGameData() {
        const savedData = localStorage.getItem('infiniteJumpData');

        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                this.coins = gameData.coins || 0;
                this.level = gameData.level || 1;
                this.highScore = gameData.highScore || 0;
                this.powerUps = gameData.powerUps || { boots: false, jetpack: false };
            } catch (e) {
                console.log('Datos nuevos, comenzando desde cero');
            }
        }
    }
}

// Inicializar el juego
window.addEventListener('load', () => {
    const game = new InfiniteJumpGame();
    console.log('Infinite Jump - Juego cargado correctamente');
    console.log('Controles: Flechas ← → para mover, Espacio para pausar');
});