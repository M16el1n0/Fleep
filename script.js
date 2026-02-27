// База данных в localStorage
const DB = {
    get: (key, defaultValue = null) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value))
        },
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// Система подарков Telegram
const GIFT_SYSTEM = {
    tiers: {
        tier1: { // 15-24 F-коины
            min: 15,
            max: 24,
            gifts: [
                { id: 'bear', name: 'Мишка', icon: '🐻', class: 'icon-bear', emoji: '🐻' },
                { id: 'heart', name: 'Сердечко', icon: '❤️', class: 'icon-heart', emoji: '❤️' }
            ]
        },
        tier2: { // 25-49 F-коины
            min: 25,
            max: 49,
            gifts: [
                { id: 'rose', name: 'Роза', icon: '🌹', class: 'icon-rose', emoji: '🌹' },
                { id: 'gift', name: 'Подарок', icon: '🎁', class: 'icon-gift', emoji: '🎁' }
            ]
        },
        tier3: { // 50-99 F-коины
            min: 50,
            max: 99,
            gifts: [
                { id: 'cake', name: 'Тортик', icon: '🎂', class: 'icon-cake', emoji: '🎂' },
                { id: 'champagne', name: 'Шампанское', icon: '🍾', class: 'icon-champagne', emoji: '🍾' },
                { id: 'bouquet', name: 'Букет', icon: '💐', class: 'icon-bouquet', emoji: '💐' },
                { id: 'rocket', name: 'Ракета', icon: '🚀', class: 'icon-rocket', emoji: '🚀' }
            ]
        },
        tier4: { // 100+ F-коины
            min: 100,
            max: 10000,
            gifts: [
                { id: 'cup', name: 'Кубок', icon: '🏆', class: 'icon-cup', emoji: '🏆' },
                { id: 'ring', name: 'Кольцо', icon: '💍', class: 'icon-ring', emoji: '💍' },
                { id: 'diamond', name: 'Алмаз', icon: '💎', class: 'icon-diamond', emoji: '💎' },
                { id: 'crown', name: 'Корона', icon: '👑', class: 'icon-crown', emoji: '👑' }
            ]
        }
    },
    
    getRandomGift: function(amount) {
        let tier;
        
        if (amount >= 15 && amount <= 24) {
            tier = 'tier1';
        } else if (amount >= 25 && amount <= 49) {
            tier = 'tier2';
        } else if (amount >= 50 && amount <= 99) {
            tier = 'tier3';
        } else if (amount >= 100) {
            tier = 'tier4';
        } else {
            return null;
        }
        
        const gifts = this.tiers[tier].gifts;
        const randomIndex = Math.floor(Math.random() * gifts.length);
        return {
            ...gifts[randomIndex],
            tier: tier,
            amount: amount,
            date: new Date().toISOString()
        };
    },
    
    getGiftById: function(giftId) {
        for (const tier in this.tiers) {
            const gift = this.tiers[tier].gifts.find(g => g.id === giftId);
            if (gift) {
                return { ...gift, tier: tier };
            }
        }
        return null;
    }
};

// Система инвентаря и вывода подарков
const INVENTORY_SYSTEM = {
    giftValues: {
        tier1: { min: 15, max: 24, sellMultiplier: 0.5 },
        tier2: { min: 25, max: 49, sellMultiplier: 0.5 },
        tier3: { min: 50, max: 99, sellMultiplier: 0.5 },
        tier4: { min: 100, max: 10000, sellMultiplier: 0.5 }
    },
    
    WITHDRAWAL_PERIOD: 21 * 24 * 60 * 60 * 1000,
    
    getGiftValue: function(gift, amount) {
        const tier = gift.tier;
        const tierValue = this.giftValues[tier];
        
        if (amount && amount >= tierValue.min && amount <= tierValue.max) {
            return amount;
        }
        
        return Math.floor((tierValue.min + tierValue.max) / 2);
    },
    
    getSellValue: function(gift, amount) {
        const fullValue = this.getGiftValue(gift, amount);
        return Math.floor(fullValue * this.giftValues[gift.tier].sellMultiplier);
    },
    
    isReadyForWithdrawal: function(giftItem) {
        if (!giftItem.receivedDate) return false;
        
        const receivedDate = new Date(giftItem.receivedDate);
        const currentDate = new Date();
        const timePassed = currentDate - receivedDate;
        
        return timePassed >= this.WITHDRAWAL_PERIOD;
    },
    
    getTimeRemaining: function(giftItem) {
        if (!giftItem.receivedDate) return 'Ошибка даты';
        
        const receivedDate = new Date(giftItem.receivedDate);
        const currentDate = new Date();
        const timePassed = currentDate - receivedDate;
        const timeRemaining = this.WITHDRAWAL_PERIOD - timePassed;
        
        if (timeRemaining <= 0) return 'Готов к выводу';
        
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        return `${days} д. ${hours} ч.`;
    },
    
    getWithdrawalDate: function(receivedDate) {
        const date = new Date(receivedDate);
        date.setDate(date.getDate() + 21);
        return date;
    }
};

// Инициализация данных пользователя
function initUserData() {
    let userData = DB.get('userData');
    
    if (!userData) {
        userData = {
            balance: {
                gold: 0,
                silver: 1000
            },
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                totalWon: 0,
                maxCoefficient: 0,
                winStreak: 0,
                maxWinStreak: 0,
                lastGameResult: null,
                giftsSold: 0,
                giftsWithdrawn: 0,
                totalEarnedFromGifts: 0
            },
            tasks: {
                1: { progress: 0, claimed: false, required: 1 },
                2: { progress: 0, claimed: false, required: 500 },
                3: { progress: 0, claimed: false, required: 5 },
                4: { progress: 0, claimed: false, required: 10 },
                5: { progress: 0, claimed: false, required: 3 }
            },
            dailyBonus: {
                lastClaimed: null,
                streak: 0
            },
            inventory: {
                active: [],
                ready: [],
                sold: [],
                withdrawn: []
            },
            cases: {
                opened: 0,
                rewards: []
            },
            registrationDate: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            gameHistory: [],
            rocketHistory: []
        };
        
        DB.set('userData', userData);
    } else {
        if (!userData.inventory) {
            userData.inventory = {
                active: [],
                ready: [],
                sold: [],
                withdrawn: []
            };
        }
        
        if (!userData.stats.giftsSold) userData.stats.giftsSold = 0;
        if (!userData.stats.giftsWithdrawn) userData.stats.giftsWithdrawn = 0;
        if (!userData.stats.totalEarnedFromGifts) userData.stats.totalEarnedFromGifts = 0;
        
        if (!userData.rocketHistory) userData.rocketHistory = [];
        
        if (!userData.cases) {
            userData.cases = {
                opened: 0,
                rewards: []
            };
        }
        
        if (!userData.balance) {
            userData.balance = {
                gold: userData.balance || 0,
                silver: 1000
            };
        }
        
        userData.lastVisit = new Date().toISOString();
        DB.set('userData', userData);
    }
    
    return userData;
}

// Глобальные переменные
let userData = initUserData();
let gameState = {
    isPlaying: false,
    currentCoefficient: 1.0,
    totalCells: 0,
    revealedCells: 0,
    minesLeft: 0,
    gameBoard: [],
    minesPositions: [],
    canCashOut: false,
    currentBet: 100,
    betType: 'silver'
};

const gameConfig = {
    size: 3,
    mines: 1,
    coefficients: {
        size: { 3: 1.5, 5: 2.0, 10: 3.0 },
        mines: { 1: 2.0, 2: 3.0, 3: 4.0, 5: 6.0 }
    }
};

// Состояние игры "Ракетка"
let rocketGameState = {
    isPlaying: false,
    isRoundActive: false,
    currentCoefficient: 1.0,
    currentBet: 100,
    betType: 'silver',
    animationFrame: null,
    rocketPosition: 0,
    roundTimer: null,
    roundCountdown: 5,
    speedFactor: 1,
    acceleration: 0,
    startTime: 0,
    crashPoint: 1.1
};

let currentNewGift = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupEventListeners();
    showSection('welcome');
    updateDailyBonusButton();
    updateInventory();
    updateRocketUI();
    startRocketCountdown();
});

// Загрузка данных пользователя
function loadUserData() {
    userData = DB.get('userData');
    updateBalance();
    updateStats();
    updateTasks();
    updateProfileInfo();
    updateGameHistory();
    updateCasesHistory();
    checkBetValidity();
}

// Сохранение данных пользователя
function saveUserData() {
    DB.set('userData', userData);
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameConfig.size = parseInt(this.dataset.size);
            updateCoefficients();
        });
    });
    
    document.querySelectorAll('.mine-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mine-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameConfig.mines = parseInt(this.dataset.mines);
            updateCoefficients();
        });
    });
}

// Навигация по разделам
function showSection(section) {
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('game-section').classList.remove('active-section');
    document.getElementById('profile-section').classList.remove('active-section');
    document.getElementById('tasks-section').classList.remove('active-section');
    document.getElementById('cases-section').classList.remove('active-section');

    // Убираем активный класс со всех кнопок навигации
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active-btn'));

    if (section === 'game') {
        document.getElementById('game-section').classList.add('active-section');
        document.getElementById('nav-game').classList.add('active-btn');
    } else if (section === 'profile') {
        document.getElementById('profile-section').classList.add('active-section');
        document.getElementById('nav-profile').classList.add('active-btn');
        updateInventory();
    } else if (section === 'tasks') {
        document.getElementById('tasks-section').classList.add('active-section');
        document.getElementById('nav-tasks').classList.add('active-btn');
    } else if (section === 'cases') {
        document.getElementById('cases-section').classList.add('active-section');
        document.getElementById('nav-cases').classList.add('active-btn');
    }
}

// Переключение между играми
// Открыть игру из карточки
function selectGame(game) {
    // Скрываем список карточек и заголовок
    document.querySelector('.game-cards-list').style.display = 'none';
    document.querySelector('.game-section-title').style.display = 'none';
    // Скрываем все game-container
    document.querySelectorAll('.game-container').forEach(el => el.style.display = 'none');
    // Показываем нужный
    document.getElementById(game + '-game').style.display = 'block';
}

function backToGamesList() {
    // Скрываем все game-container
    document.querySelectorAll('.game-container').forEach(el => el.style.display = 'none');
    // Показываем список
    document.querySelector('.game-cards-list').style.display = 'flex';
    document.querySelector('.game-section-title').style.display = 'block';
}

function switchGame(game) {
    document.querySelectorAll('.game-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.game-container').forEach(container => container.classList.remove('active'));
    
    document.querySelector(`[data-game="${game}"]`).classList.add('active');
    document.getElementById(`${game}-game`).classList.add('active');
    
    // Особые действия при переключении на ракетку
    if (game === 'rocket') {
        updateRocketUI();
    }
}

// Обновление баланса
function updateBalance() {
    const gold = userData.balance.gold;
    const silver = userData.balance.silver;
    
    document.getElementById('header-gold-flip').textContent = gold;
    document.getElementById('header-silver-flip').textContent = silver;
    
    document.getElementById('game-balance').innerHTML = `${silver} <span class="coin-symbol silver">F</span>`;
    document.getElementById('current-balance').innerHTML = `${silver} <span class="coin-symbol silver">F</span>`;
    document.getElementById('user-balance').innerHTML = `${silver} <span class="coin-symbol silver">F</span>`;
    document.getElementById('user-gold-flip').textContent = gold;
    document.getElementById('user-silver-flip').textContent = silver;
    document.getElementById('rocket-balance').innerHTML = `${silver} <span class="coin-symbol silver">F</span>`;
    
    checkBetValidity();
}

// Проверка валидности ставки
function checkBetValidity() {
    const bet = gameState.currentBet;
    const balance = userData.balance[gameState.betType];
    const warning = document.getElementById('balance-warning');
    const playBtn = document.getElementById('play-btn');
    
    if (bet > balance) {
        warning.style.display = 'flex';
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
    } else {
        warning.style.display = 'none';
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
    }
}

// Управление ставкой
function changeBet(amount) {
    let newBet = gameState.currentBet + amount;
    
    if (newBet < 10) newBet = 10;
    if (newBet > 10000) newBet = 10000;
    
    gameState.currentBet = newBet;
    document.getElementById('current-bet').textContent = newBet;
    
    updateCoefficients();
    checkBetValidity();
}

function setBet(amount) {
    if (amount > 10000) amount = 10000;
    if (amount < 10) amount = 10;
    
    gameState.currentBet = amount;
    document.getElementById('current-bet').textContent = amount;
    
    updateCoefficients();
    checkBetValidity();
}

// Обновление коэффициентов
function updateCoefficients() {
    const sizeCoef = gameConfig.coefficients.size[gameConfig.size];
    const mineCoef = gameConfig.coefficients.mines[gameConfig.mines];
    const totalCoef = (sizeCoef * mineCoef).toFixed(2);
    
    document.getElementById('size-coef').textContent = sizeCoef + 'x';
    document.getElementById('mine-coef').textContent = mineCoef + 'x';
    document.getElementById('total-coef').textContent = totalCoef + 'x';
    
    const potentialWin = Math.floor(gameState.currentBet * parseFloat(totalCoef));
    document.getElementById('potential-win').textContent = potentialWin;
}

// Начать игру "Мины"
function startGame() {
    const bet = gameState.currentBet;
    const balance = userData.balance[gameState.betType];
    
    if (bet > balance) {
        alert('Недостаточно средств на балансе!');
        return;
    }
    
    if (gameConfig.mines >= gameConfig.size * gameConfig.size) {
        alert('Количество мин не может быть больше или равно количеству клеток!');
        return;
    }
    
    userData.balance[gameState.betType] -= bet;
    saveUserData();
    updateBalance();
    
    gameState.isPlaying = true;
    gameState.currentCoefficient = 1.0;
    gameState.totalCells = gameConfig.size * gameConfig.size;
    gameState.revealedCells = 0;
    gameState.minesLeft = gameConfig.mines;
    gameState.gameBoard = [];
    gameState.minesPositions = [];
    gameState.canCashOut = false;
    
    createGameBoard();
    placeMines();
    
    document.getElementById('game-board').classList.remove('hidden');
    document.querySelector('.game-settings').classList.add('hidden');
    
    updateGameInterface();
    document.getElementById('cashout-btn').disabled = true;
}

// Создать игровое поле
function createGameBoard() {
    const grid = document.getElementById('mines-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gameConfig.size}, 1fr)`;
    
    gameState.gameBoard = [];
    
    for (let i = 0; i < gameState.totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.innerHTML = '<i class="fas fa-question"></i>';
        
        cell.addEventListener('click', () => revealCell(i));
        
        grid.appendChild(cell);
        gameState.gameBoard.push({
            isMine: false,
            isRevealed: false,
            element: cell
        });
    }
}

// Разместить мины
function placeMines() {
    const positions = new Set();
    
    while (positions.size < gameConfig.mines) {
        const pos = Math.floor(Math.random() * gameState.totalCells);
        if (!positions.has(pos)) {
            positions.add(pos);
            gameState.gameBoard[pos].isMine = true;
            gameState.minesPositions.push(pos);
        }
    }
}

// Открыть клетку
function revealCell(index) {
    if (!gameState.isPlaying || gameState.gameBoard[index].isRevealed) {
        return;
    }
    
    const cell = gameState.gameBoard[index];
    cell.isRevealed = true;
    cell.element.classList.add('revealed');
    
    if (cell.isMine) {
        cell.element.innerHTML = '<i class="fas fa-bomb"></i>';
        cell.element.classList.add('mine');
        endGame(false);
    } else {
        cell.element.innerHTML = '<i class="fas fa-gem"></i>';
        gameState.revealedCells++;
        
        const safeCells = gameState.totalCells - gameConfig.mines;
        const multiplier = 1 + (gameConfig.mines / safeCells) * 0.5;
        gameState.currentCoefficient *= multiplier;
        
        if (gameState.revealedCells >= Math.floor(gameConfig.size / 2)) {
            gameState.canCashOut = true;
            document.getElementById('cashout-btn').disabled = false;
        }
        
        if (gameState.revealedCells === safeCells) {
            endGame(true);
        }
        
        updateGameInterface();
    }
}

// Забрать выигрыш
function cashOut() {
    if (gameState.isPlaying && gameState.canCashOut) {
        endGame(true);
    }
}

// Закончить игру
function endGame(isWin) {
    gameState.isPlaying = false;
    
    userData.stats.gamesPlayed++;
    
    gameState.minesPositions.forEach(pos => {
        if (!gameState.gameBoard[pos].isRevealed) {
            gameState.gameBoard[pos].element.innerHTML = '<i class="fas fa-bomb"></i>';
            gameState.gameBoard[pos].element.classList.add('mine');
        }
    });
    
    const winAmount = isWin ? Math.floor(gameState.currentBet * gameState.currentCoefficient) : 0;
    const gameResult = {
        timestamp: new Date().toISOString(),
        bet: gameState.currentBet,
        win: winAmount,
        coefficient: gameState.currentCoefficient,
        isWin: isWin,
        fieldSize: gameConfig.size,
        mines: gameConfig.mines
    };
    
    if (isWin) {
        userData.balance[gameState.betType] += winAmount;
        userData.stats.gamesWon++;
        userData.stats.totalWon += winAmount;
        
        userData.stats.winStreak++;
        if (userData.stats.winStreak > userData.stats.maxWinStreak) {
            userData.stats.maxWinStreak = userData.stats.winStreak;
        }
        
        if (gameState.currentCoefficient > userData.stats.maxCoefficient) {
            userData.stats.maxCoefficient = gameState.currentCoefficient;
        }
        
        userData.stats.lastGameResult = 'win';
        
        if (winAmount >= 15) {
            const gift = GIFT_SYSTEM.getRandomGift(winAmount);
            if (gift) {
                setTimeout(() => {
                    showGiftChoiceModal(gift, winAmount);
                }, 1000);
            }
        }
    } else {
        userData.stats.gamesLost++;
        userData.stats.winStreak = 0;
        userData.stats.lastGameResult = 'lose';
    }
    
    userData.gameHistory.unshift(gameResult);
    if (userData.gameHistory.length > 20) {
        userData.gameHistory = userData.gameHistory.slice(0, 20);
    }
    
    updateTasksAfterGame(isWin, winAmount, gameState.currentCoefficient);
    
    saveUserData();
    
    updateBalance();
    updateStats();
    updateTasks();
    updateGameHistory();
    
    if (!isWin) {
        alert('Вы попали на мину! Игра окончена.');
    }
    
    document.querySelector('.game-controls').classList.remove('hidden');
}

// Новая игра
function newGame() {
    document.getElementById('game-board').classList.add('hidden');
    document.querySelector('.game-settings').classList.remove('hidden');
    document.querySelector('.game-controls').classList.add('hidden');
}

// Обновить интерфейс игры
function updateGameInterface() {
    document.getElementById('current-coef').textContent = gameState.currentCoefficient.toFixed(2) + 'x';
    document.getElementById('current-win').textContent = Math.floor(gameState.currentBet * gameState.currentCoefficient);
    document.getElementById('mines-left').textContent = gameConfig.mines;
}

// Обновить статистику
function updateStats() {
    const stats = userData.stats;
    const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('games-won').textContent = stats.gamesWon;
    document.getElementById('games-lost').textContent = stats.gamesLost;
    document.getElementById('win-rate').textContent = winRate;
    document.getElementById('total-won').textContent = stats.totalWon;
    document.getElementById('max-coef').textContent = stats.maxCoefficient.toFixed(2);
}

// Обновить задания после игры
function updateTasksAfterGame(isWin, winAmount, coefficient) {
    const tasks = userData.tasks;
    
    if (userData.stats.gamesPlayed === 1) {
        tasks[1].progress = 1;
    }
    
    if (isWin && winAmount >= 500 && winAmount > tasks[2].progress) {
        tasks[2].progress = winAmount;
    }
    
    tasks[3].progress = userData.stats.gamesWon;
    
    if (coefficient > tasks[4].progress) {
        tasks[4].progress = coefficient;
    }
    
    if (isWin) {
        tasks[5].progress = userData.stats.winStreak;
    } else {
        tasks[5].progress = 0;
    }
    
    saveUserData();
}

// Обновить отображение заданий
function updateTasks() {
    const tasks = userData.tasks;
    let completedCount = 0;
    let totalRewards = 0;
    
    for (let i = 1; i <= 5; i++) {
        const task = tasks[i];
        const taskElement = document.getElementById(`task-${i}`);
        const progressFill = document.getElementById(`task-${i}-progress`);
        const progressText = document.getElementById(`task-${i}-text`);
        const taskBtn = document.getElementById(`task-${i}-btn`);
        
        const progressPercent = Math.min((task.progress / task.required) * 100, 100);
        
        progressFill.style.width = `${progressPercent}%`;
        progressText.textContent = task.required <= 10 ? 
            `${task.progress}/${task.required}` : 
            `${task.progress} <span class="coin-symbol silver">F</span>`;
        
        const isCompleted = task.progress >= task.required;
        const isClaimed = task.claimed;
        
        if (isClaimed) {
            taskElement.classList.add('claimed');
            taskBtn.classList.add('claimed');
            taskBtn.innerHTML = '<i class="fas fa-check"></i> Награда получена';
            taskBtn.disabled = true;
            totalRewards += getTaskReward(i);
        } else if (isCompleted) {
            taskElement.classList.add('completed');
            taskBtn.disabled = false;
            completedCount++;
        } else {
            taskElement.classList.remove('completed', 'claimed');
            taskBtn.disabled = true;
            taskBtn.innerHTML = '<i class="fas fa-gift"></i> Получить награду';
            taskBtn.classList.remove('claimed');
        }
    }
    
    document.getElementById('tasks-completed').textContent = completedCount;
    document.getElementById('total-rewards').textContent = totalRewards;
}

// Получить награду за задание
function claimTaskReward(taskId) {
    const task = userData.tasks[taskId];
    
    if (!task.claimed && task.progress >= task.required) {
        const reward = getTaskReward(taskId);
        
        userData.balance.silver += reward;
        
        task.claimed = true;
        
        saveUserData();
        
        updateBalance();
        updateTasks();
        
        alert(`Награда получена! +${reward} <span class="coin-symbol silver">F</span> зачислено на ваш баланс.`);
    }
}

// Получить размер награды за задание
function getTaskReward(taskId) {
    const rewards = {
        1: 100,
        2: 200,
        3: 500,
        4: 1000,
        5: 1500
    };
    
    return rewards[taskId] || 0;
}

// Получить ежедневный бонус
function claimDailyBonus() {
    const now = new Date();
    const today = now.toDateString();
    const lastClaimed = userData.dailyBonus.lastClaimed ? 
        new Date(userData.dailyBonus.lastClaimed).toDateString() : null;
    
    if (lastClaimed === today) {
        alert('Вы уже получали бонус сегодня. Приходите завтра!');
        return;
    }
    
    let bonus = 100;
    let streakMessage = '';
    
    if (lastClaimed && (now - new Date(userData.dailyBonus.lastClaimed)) <= 86400000 * 2) {
        userData.dailyBonus.streak++;
        bonus += userData.dailyBonus.streak * 20;
        streakMessage = `\nВаша серия: ${userData.dailyBonus.streak} дней`;
    } else {
        userData.dailyBonus.streak = 1;
    }
    
    userData.balance.silver += bonus;
    userData.dailyBonus.lastClaimed = now.toISOString();
    
    saveUserData();
    
    updateBalance();
    updateDailyBonusButton();
    
    alert(`Ежедневный бонус получен! +${bonus} <span class="coin-symbol silver">F</span> зачислено на ваш баланс.${streakMessage}`);
}

// Обновить кнопку ежедневного бонуса
function updateDailyBonusButton() {
    const btn = document.getElementById('daily-bonus-btn');
    const rocketBtn =
        document.getElementById('rocket-daily-bonus-btn');
    const now = new Date();
    const today = now.toDateString();
    const lastClaimed = userData.dailyBonus.lastClaimed ? 
        new Date(userData.dailyBonus.lastClaimed).toDateString() : null;
    
    if (lastClaimed === today) {
        btn.innerHTML = '<i class="fas fa-check"></i> Бонус получен';
        rocketBtn.innerHTML = '<i class="fas fa-check"></i> Бонус получен';
        btn.disabled = true;
        rocketBtn.disabled = true;
        
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        
        const timeLeft = nextDay - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        
        document.getElementById('next-bonus').textContent = `через ${hoursLeft}ч`;
    } else {
        btn.innerHTML = '<i class="fas fa-gift"></i> Ежедневный бонус';
        rocketBtn.innerHTML = '<i class="fas fa-gift"></i> Ежедневный бонус';
        btn.disabled = false;
        rocketBtn.disabled = false;
        
        let nextBonusText = 'сегодня';
        if (lastClaimed) {
            const lastDate = new Date(userData.dailyBonus.lastClaimed);
            const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                nextBonusText = 'сегодня';
            } else if (daysDiff > 1) {
                nextBonusText = 'серия сброшена';
            }
        }
        document.getElementById('next-bonus').textContent = nextBonusText;
    }
}

// Обновить информацию профиля
function updateProfileInfo() {
    const regDate = new Date(userData.registrationDate);
    const lastVisit = new Date(userData.lastVisit);
    
    document.getElementById('reg-date').textContent = regDate.toLocaleDateString('ru-RU');
    document.getElementById('last-visit').textContent = lastVisit.toLocaleDateString('ru-RU');
    
    const userName = `Игрок#${Math.abs(regDate.getTime() % 10000).toString().padStart(4, '0')}`;
    document.getElementById('user-name').textContent = userName;
    
    updateDailyBonusButton();
}

// Обновить историю игр
function updateGameHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    userData.gameHistory.slice(0, 10).forEach(game => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${game.isWin ? 'win' : 'lose'}`;
        
        const date = new Date(game.timestamp);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        historyItem.innerHTML = `
            <div>
                <strong>${game.isWin ? 'Победа' : 'Поражение'}</strong>
                <small>${time}</small>
            </div>
            <div>
                ${game.isWin ? `+${game.win} <span class="coin-symbol silver">F</span>` : `-${game.bet} <span class="coin-symbol silver">F</span>`}
                <small>${game.coefficient.toFixed(2)}x</small>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
    
    if (userData.gameHistory.length === 0) {
        historyList.innerHTML = '<div class="no-history">История игр пуста</div>';
    }
}

// Обновление интерфейса ракетки
function updateRocketUI() {
    document.getElementById('rocket-current-bet').textContent = rocketGameState.currentBet;
    
    const potentialWin = Math.floor(rocketGameState.currentBet * rocketGameState.currentCoefficient);
    const rpw = document.getElementById('rocket-potential-win');
    if (rpw) rpw.innerHTML = potentialWin + ' <span class="coin-symbol silver">F</span>';
    
    checkRocketBetValidity();
    updateRocketHistory();
}

// Проверка валидности ставки для ракетки
function checkRocketBetValidity() {
    const bet = rocketGameState.currentBet;
    const balance = userData.balance[rocketGameState.betType];
    const warning = document.getElementById('rocket-balance-warning');
    const playBtn = document.getElementById('rocket-play-btn');
    
    if (bet > balance) {
        warning.style.display = 'flex';
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
    } else {
        warning.style.display = 'none';
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
    }
}

// Управление ставкой для ракетки
function changeRocketBet(amount) {
    let newBet = rocketGameState.currentBet + amount;
    
    if (newBet < 10) newBet = 10;
    if (newBet > 10000) newBet = 10000;
    
    rocketGameState.currentBet = newBet;
    updateRocketUI();
}

function setRocketBet(amount) {
    if (amount > 10000) amount = 10000;
    if (amount < 10) amount = 10;
    
    rocketGameState.currentBet = amount;
    updateRocketUI();
}

// Запуск игры "Ракетка"
function startRocketGame() {
    if (rocketGameState.isRoundActive || rocketGameState.roundCountdown > 0) {
        return;
    }
    
    if (rocketGameState.currentBet > userData.balance[rocketGameState.betType]) {
        alert('Недостаточно средств на балансе!');
        return;
    }
    
    userData.balance[rocketGameState.betType] -= rocketGameState.currentBet;
    saveUserData();
    updateBalance();
    updateRocketUI();
    
    rocketGameState.isPlaying = true;
    rocketGameState.isRoundActive = true;
    rocketGameState.currentCoefficient = 1.0;
    rocketGameState.rocketPosition = 0;
    rocketGameState.startTime = Date.now();
    
    // Генерация точки падения (медленная и редкая)
    rocketGameState.crashPoint = generateCrashPoint();
    
    document.getElementById('rocket-cashout-btn').disabled = false;
    document.getElementById('rocket-play-btn').disabled = true;
    
    // Очистка предыдущей траектории (canvas)
    const _cvs = document.getElementById('rocket-canvas');
    if (_cvs) { const _c = _cvs.getContext('2d'); if(_c) _c.clearRect(0,0,_cvs.width,_cvs.height); }
    
    // Анимация полета ракеты
    animateRocket();
    
    // Таймер падения: вычисляем реальное время до краша
    const crashTime = Math.pow((rocketGameState.crashPoint - 1.0) / 0.8, 2) * 1000;
    setTimeout(() => {
        if (rocketGameState.isRoundActive) {
            endRocketGame(false, rocketGameState.currentCoefficient);
        }
    }, Math.max(crashTime, 500));
}

// Генерация точки падения ракеты (редкие высокие коэффициенты)
function generateCrashPoint() {
    const rand = Math.random();
    
    if (rand < 0.3) {
        return 1.1 + Math.random() * 0.4; // 1.1-1.5x (30%)
    } else if (rand < 0.6) {
        return 1.5 + Math.random() * 0.5; // 1.5-2.0x (30%)
    } else if (rand < 0.8) {
        return 2.0 + Math.random() * 3.0; // 2.0-5.0x (20%)
    } else if (rand < 0.9) {
        return 5.0 + Math.random() * 2.0; // 5.0-7.0x (10%)
    } else if (rand < 0.97) {
        return 7.0 + Math.random() * 3.0; // 7.0-10.0x (7%)
    } else {
        return 10.0 + Math.random() * 40.0; // 10.0-50.0x (3%)
    }
}

// Анимация полета ракеты
function animateRocket() {
    const rocketEl = document.getElementById('rocket-emoji');
    const fireEl   = document.getElementById('rocket-fire');
    const cvs      = document.getElementById('rocket-canvas');
    const ctx      = cvs ? cvs.getContext('2d') : null;
    const coefficientDisplay = document.getElementById('rocket-coefficient');

    if (!rocketEl) return;

    // Показываем ракету и огонь
    rocketEl.style.display = 'block';
    rocketEl.style.opacity = '1';
    fireEl.style.display   = 'block';
    fireEl.style.opacity   = '0.85';

    // Подгоняем canvas под реальный размер контейнера
    if (cvs) {
        cvs.width  = cvs.offsetWidth  || 400;
        cvs.height = cvs.offsetHeight || 300;
    }

    // Размеры контейнера
    const W = cvs ? cvs.width  : 400;
    const H = cvs ? cvs.height : 300;

    // Стартовая позиция
    const startX = W * 0.15;
    const startY = H - 30;

    // Траектория: точки пути
    const trail = [];

    // Угол наклона ракеты в начале: -45° (нос вправо-вверх)
    let angle = -45;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animate() {
        if (!rocketGameState.isRoundActive) return;

        const elapsed = (Date.now() - rocketGameState.startTime) / 1000;

        // Коэффициент
        rocketGameState.currentCoefficient = 1.0 + Math.sqrt(elapsed) * 0.8;
        if (rocketGameState.currentCoefficient > rocketGameState.crashPoint) {
            rocketGameState.currentCoefficient = rocketGameState.crashPoint;
        }
        coefficientDisplay.textContent = rocketGameState.currentCoefficient.toFixed(2) + 'x';

        // Позиция: дуга снизу-слева → вверх-вправо
        const progress = Math.min(elapsed / 6, 1); // 6 сек до края
        const curveX = startX + Math.pow(progress, 0.7) * (W - startX - 30);
        const curveY = startY - Math.pow(progress, 0.55) * (H - 40);

        // Угол: плавно от -45° к -80° (почти вертикально)
        const targetAngle = lerp(-45, -80, Math.min(elapsed / 4, 1));
        angle += (targetAngle - angle) * 0.04;

        // Лёгкое покачивание
        const wobble = Math.sin(elapsed * 3) * 3;
        const displayAngle = angle + wobble;

        // Позиция ракеты
        rocketEl.style.left = curveX + 'px';
        rocketEl.style.top  = curveY + 'px';
        rocketEl.style.transform = `translate(-50%,-50%) rotate(${displayAngle}deg)`;

        // Огонь — чуть сзади ракеты
        const fireOffset = 30;
        const rad = (displayAngle + 135) * Math.PI / 180;
        const fireX = curveX + Math.cos(rad) * fireOffset;
        const fireY = curveY + Math.sin(rad) * fireOffset;
        fireEl.style.left = fireX + 'px';
        fireEl.style.top  = fireY + 'px';
        fireEl.style.transform = `translate(-50%,-50%) rotate(${displayAngle + 135}deg)`;
        // Пульсация огня
        const fireScale = 0.8 + Math.sin(elapsed * 12) * 0.2;
        fireEl.style.fontSize = (22 * fireScale) + 'px';

        // Рисуем след
        trail.push({ x: curveX, y: curveY });
        if (trail.length > 120) trail.shift();

        if (ctx) {
            ctx.clearRect(0, 0, W, H);

            // Линия старта
            ctx.beginPath();
            ctx.moveTo(20, H - 20);
            ctx.lineTo(W - 20, H - 20);
            ctx.strokeStyle = 'rgba(76, 217, 100, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(76, 217, 100, 0.6)';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('СТАРТ', W / 2, H - 6);

            // Градиентный след
            if (trail.length > 2) {
                for (let i = 1; i < trail.length; i++) {
                    const alpha = (i / trail.length) * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(trail[i-1].x, trail[i-1].y);
                    ctx.lineTo(trail[i].x, trail[i].y);
                    ctx.strokeStyle = `rgba(138, 43, 226, ${alpha})`;
                    ctx.lineWidth = 1.5 * (i / trail.length);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// Забрать выигрыш в игре "Ракетка"
function cashOutRocket() {
    if (rocketGameState.isPlaying && rocketGameState.isRoundActive) {
        endRocketGame(true, rocketGameState.currentCoefficient);
    }
}

// Закончить игру "Ракетка"
function endRocketGame(isWin, multiplier) {
    rocketGameState.isRoundActive = false;
    rocketGameState.isPlaying = false;
    
    const winAmount = isWin ? Math.floor(rocketGameState.currentBet * multiplier) : 0;
    
    const gameResult = {
        timestamp: new Date().toISOString(),
        bet: rocketGameState.currentBet,
        win: winAmount,
        coefficient: multiplier,
        isWin: isWin
    };
    
    userData.rocketHistory.unshift(gameResult);
    if (userData.rocketHistory.length > 20) {
        userData.rocketHistory = userData.rocketHistory.slice(0, 20);
    }
    
    if (isWin) {
        userData.balance[rocketGameState.betType] += winAmount;
        userData.stats.totalWon += winAmount;
        
        // Добавление подарка при выигрыше
        if (winAmount >= 15) {
            const gift = GIFT_SYSTEM.getRandomGift(winAmount);
            if (gift) {
                setTimeout(() => {
                    showGiftChoiceModal(gift, winAmount);
                }, 1000);
            }
        }
    }
    
    saveUserData();
    
    updateBalance();
    updateStats();
    updateRocketUI();
    updateRocketHistory();
    
    // Запуск таймера следующего раунда
    startRocketCountdown();
    
    // Анимация падения / сброс ракеты
    const rocketEl = document.getElementById('rocket-emoji');
    const fireEl   = document.getElementById('rocket-fire');
    const cvs      = document.getElementById('rocket-canvas');

    if (!isWin && rocketEl) {
        // Ракета кувыркается и падает
        let spin = 0;
        let vy   = -2;
        let curTop = parseFloat(rocketEl.style.top) || 250;
        let curLeft = parseFloat(rocketEl.style.left) || 200;

        function fall() {
            spin += 12;
            vy   += 3;
            curTop  += vy;
            curLeft += 2;
            rocketEl.style.top  = curTop + 'px';
            rocketEl.style.left = curLeft + 'px';
            rocketEl.style.transform = `translate(-50%,-50%) rotate(${spin}deg)`;
            rocketEl.style.opacity = Math.max(0, 1 - curTop / 400);
            if (fireEl) fireEl.style.opacity = '0';

            if (curTop < 500) requestAnimationFrame(fall);
            else {
                // Сброс в начало
                resetRocketEmoji();
            }
        }
        requestAnimationFrame(fall);
    } else {
        setTimeout(resetRocketEmoji, 500);
    }

    function resetRocketEmoji() {
        if (rocketEl) {
            rocketEl.style.display = 'none';
            rocketEl.style.opacity = '1';
            rocketEl.style.left = '60px';
            rocketEl.style.top  = '270px';
            rocketEl.style.transform = 'translate(-50%,-50%) rotate(-45deg)';
        }
        if (fireEl) { fireEl.style.display = 'none'; fireEl.style.opacity = '0.85'; }
        if (cvs) { const c = cvs.getContext('2d'); if(c) c.clearRect(0,0,cvs.width,cvs.height); }
    }
}

// Обновить историю игры "Ракетка"
function updateRocketHistory() {
    const historyList = document.getElementById('rocket-history-list');
    historyList.innerHTML = '';
    
    userData.rocketHistory.slice(0, 10).forEach(game => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${game.isWin ? 'win' : 'lose'}`;
        
        const date = new Date(game.timestamp);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        historyItem.innerHTML = `
            <div>
                <strong>${game.isWin ? 'Победа' : 'Поражение'}</strong>
                <small>${time}</small>
            </div>
            <div>
                ${game.isWin ? `+${game.win} <span class="coin-symbol silver">F</span>` : `-${game.bet} <span class="coin-symbol silver">F</span>`}
                <small>${game.coefficient.toFixed(2)}x</small>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
    
    if (userData.rocketHistory.length === 0) {
        historyList.innerHTML = '<div class="no-history">История игр пуста</div>';
    }
}

// Запуск таймера следующего раунда
function startRocketCountdown() {
    rocketGameState.roundCountdown = 5;
    updateRocketCountdown();
    
    rocketGameState.roundTimer = setInterval(() => {
        rocketGameState.roundCountdown--;
        
        if (rocketGameState.roundCountdown <= 0) {
            clearInterval(rocketGameState.roundTimer);
            rocketGameState.roundTimer = null;
            document.getElementById('rocket-play-btn').disabled = false;
            return;
        }
        
        updateRocketCountdown();
    }, 1000);
}

// Обновить отображение таймера
function updateRocketCountdown() {
    document.getElementById('round-timer').textContent = rocketGameState.roundCountdown;
}

// Система инвентаря

// Обновление инвентаря
function updateInventory() {
    const tabs = ['active', 'ready', 'sold', 'withdrawn'];
    
    tabs.forEach(tab => {
        const grid = document.getElementById(`inventory-${tab}-grid`);
        const noItems = document.getElementById(`no-${tab}-items`);
        const inventory = userData.inventory[tab];
        
        grid.innerHTML = '';
        
        if (inventory.length === 0) {
            grid.style.display = 'none';
            noItems.style.display = 'block';
        } else {
            grid.style.display = 'grid';
            noItems.style.display = 'none';
            
            inventory.forEach((item, index) => {
                const gift = GIFT_SYSTEM.getGiftById(item.giftId);
                if (!gift) return;
                
                const inventoryItem = document.createElement('div');
                inventoryItem.className = `inventory-item ${tab}`;
                inventoryItem.dataset.index = index;
                inventoryItem.innerHTML = `
                    <div class="inventory-item-header">
                        <div class="inventory-item-icon ${gift.class}">${gift.emoji}</div>
                        <div>
                            <div class="inventory-item-name">${gift.name}</div>
                            <div class="inventory-item-value">${item.amount} <span class="coin-symbol silver">F</span></div>
                        </div>
                    </div>
                    <div class="inventory-item-status status-${tab}">${getStatusText(tab)}</div>
                    ${tab === 'active' ? `
                        <div class="inventory-item-timer">
                            <i class="fas fa-clock"></i>
                            ${INVENTORY_SYSTEM.getTimeRemaining(item)}
                        </div>
                    ` : ''}
                `;
                
                inventoryItem.addEventListener('click', () => manageGift(item, tab, index));
                grid.appendChild(inventoryItem);
            });
        }
    });
}

// Получить текст статуса
function getStatusText(status) {
    const texts = {
        active: 'Активен',
        ready: 'Готов к выводу',
        sold: 'Продан',
        withdrawn: 'Выведен'
    };
    
    return texts[status] || status;
}

// Управление подарком
function manageGift(giftItem, tab, index) {
    currentNewGift = { ...giftItem, tab, index };
    
    const gift = GIFT_SYSTEM.getGiftById(giftItem.giftId);
    if (!gift) return;
    
    const modal = document.getElementById('manage-gift-modal');
    const info = document.getElementById('manage-gift-info');
    const actions = document.getElementById('manage-gift-actions');
    
    info.innerHTML = `
        <div class="gift-info">
            <div class="gift-icon-large ${gift.class}">${gift.emoji}</div>
            <h3>${gift.name}</h3>
            <div class="gift-details">Стоимость: <strong>${giftItem.amount} <span class="coin-symbol silver">F</span></strong></div>
            <div class="gift-details">Уровень: <strong>${getTierName(gift.tier)}</strong></div>
            <div class="gift-details">Получен: <strong>${new Date(giftItem.receivedDate).toLocaleDateString('ru-RU')}</strong></div>
            ${giftItem.tab === 'active' ? `
                <div class="gift-details">Доступен для вывода: <strong>${INVENTORY_SYSTEM.getWithdrawalDate(giftItem.receivedDate).toLocaleDateString('ru-RU')}</strong></div>
            ` : ''}
        </div>
    `;
    
    actions.innerHTML = '';
    
    if (giftItem.tab === 'active') {
        if (INVENTORY_SYSTEM.isReadyForWithdrawal(giftItem)) {
            const withdrawBtn = document.createElement('button');
            withdrawBtn.className = 'action-btn withdraw';
            withdrawBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Вывести';
            withdrawBtn.addEventListener('click', withdrawGift);
            actions.appendChild(withdrawBtn);
        }
        
        const sellBtn = document.createElement('button');
        sellBtn.className = 'action-btn sell';
        const sellValue = INVENTORY_SYSTEM.getSellValue(gift, giftItem.amount);
        sellBtn.innerHTML = `<i class="fas fa-money-bill-wave"></i> Продать за ${sellValue} <span class="coin-symbol silver">F</span>`;
        sellBtn.addEventListener('click', sellGiftFromInventory);
        actions.appendChild(sellBtn);
    }
    
    modal.style.display = 'flex';
}

// Получить название уровня
function getTierName(tier) {
    const names = {
        tier1: 'Обычный',
        tier2: 'Редкий',
        tier3: 'Эпический',
        tier4: 'Легендарный'
    };
    
    return names[tier] || 'Неизвестно';
}

// Закрыть модальное окно управления подарком
function closeManageGiftModal() {
    document.getElementById('manage-gift-modal').style.display = 'none';
    currentNewGift = null;
}

// Вывести подарок
function withdrawGift() {
    if (!currentNewGift) return;
    
    const gift = GIFT_SYSTEM.getGiftById(currentNewGift.giftId);
    if (!gift || currentNewGift.tab !== 'active') return;
    
    if (!INVENTORY_SYSTEM.isReadyForWithdrawal(currentNewGift)) {
        alert('Подарок еще не готов для вывода!');
        return;
    }
    
    // Перемещение подарка в выведенные
    userData.inventory.withdrawn.unshift({
        ...currentNewGift,
        withdrawnDate: new Date().toISOString()
    });
    
    userData.inventory.active.splice(currentNewGift.index, 1);
    
    userData.stats.giftsWithdrawn++;
    userData.stats.totalEarnedFromGifts += currentNewGift.amount;
    
    saveUserData();
    
    updateInventory();
    updateStats();
    closeManageGiftModal();
    
    alert(`Подарок "${gift.name}" успешно выведен!`);
}

// Продать подарок из инвентаря
function sellGiftFromInventory() {
    if (!currentNewGift) return;
    
    const gift = GIFT_SYSTEM.getGiftById(currentNewGift.giftId);
    if (!gift || currentNewGift.tab !== 'active') return;
    
    const sellValue = INVENTORY_SYSTEM.getSellValue(gift, currentNewGift.amount);
    
    userData.balance.silver += sellValue;
    userData.stats.giftsSold++;
    userData.stats.totalEarnedFromGifts += sellValue;
    
    userData.inventory.sold.unshift({
        ...currentNewGift,
        soldDate: new Date().toISOString(),
        soldFor: sellValue
    });
    
    userData.inventory.active.splice(currentNewGift.index, 1);
    
    saveUserData();
    
    updateBalance();
    updateStats();
    updateInventory();
    closeManageGiftModal();
    
    alert(`Подарок "${gift.name}" продан за ${sellValue} <span class="coin-symbol silver">F</span>!`);
}

// Показать модальное окно выбора подарка
function showGiftChoiceModal(gift, amount) {
    const modal = document.getElementById('new-gift-modal');
    const sellAmount = Math.floor(amount * 0.5);
    
    document.getElementById('new-gift-icon').textContent = gift.emoji;
    document.getElementById('new-gift-icon').className = `gift-icon-large ${gift.class}`;
    document.getElementById('new-gift-name').textContent = gift.name;
    document.getElementById('new-gift-value').textContent = amount;
    document.getElementById('new-gift-tier').innerHTML = `<i class="fas fa-star"></i> Уровень: ${getTierName(gift.tier)}`;
    
    document.getElementById('sell-amount').textContent = sellAmount;
    document.getElementById('full-value').textContent = amount;
    
    currentNewGift = {
        giftId: gift.id,
        amount: amount,
        receivedDate: new Date().toISOString(),
        tier: gift.tier
    };
    
    // Позиционирование модального окна по центру видимой области
    modal.style.display = 'flex';
    modal.scrollTop = 0;
    
    // Принудительное обновление позиции
    setTimeout(() => {
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
    }, 100);
}

// Закрыть модальное окно нового подарка
function closeNewGiftModal() {
    document.getElementById('new-gift-modal').style.display = 'none';
    currentNewGift = null;
}

// Продать подарок
function sellGift() {
    if (!currentNewGift) return;
    
    const gift = GIFT_SYSTEM.getGiftById(currentNewGift.giftId);
    if (!gift) return;
    
    const sellValue = Math.floor(currentNewGift.amount * 0.5);
    
    userData.balance.silver += sellValue;
    userData.stats.giftsSold++;
    userData.stats.totalEarnedFromGifts += sellValue;
    
    userData.inventory.sold.unshift({
        ...currentNewGift,
        soldDate: new Date().toISOString(),
        soldFor: sellValue
    });
    
    saveUserData();
    
    updateBalance();
    updateStats();
    updateInventory();
    closeNewGiftModal();
    
    alert(`Подарок "${gift.name}" продан за ${sellValue} <span class="coin-symbol silver">F</span>!`);
}

// Оставить подарок в инвентаре
function keepGift() {
    if (!currentNewGift) return;
    
    const gift = GIFT_SYSTEM.getGiftById(currentNewGift.giftId);
    if (!gift) return;
    
    userData.inventory.active.unshift(currentNewGift);
    
    saveUserData();
    
    updateInventory();
    closeNewGiftModal();
    
    alert(`Подарок "${gift.name}" добавлен в инвентарь! Его можно будет вывести через 21 день.`);
}

// Отобразить вкладку инвентаря
function showInventoryTab(tab) {
    document.querySelectorAll('.inv-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.inventory-tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.inv-tab[onclick="showInventoryTab('${tab}')"]`).classList.add('active');
    document.getElementById(`inventory-${tab}`).classList.add('active');
}

// Инициализация вкладки профиля
function initProfileTab() {
    showInventoryTab('active');
}

// Система кейсов

// Обновление истории открытий кейсов
function updateCasesHistory() {
    const historyList = document.getElementById('cases-history-list');
    historyList.innerHTML = '';
    
    userData.cases.rewards.slice(0, 10).forEach(reward => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item win`;
        
        const date = new Date(reward.timestamp);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        historyItem.innerHTML = `
            <div>
                <strong>${reward.caseType}</strong>
                <small>${time}</small>
            </div>
            <div>
                ${reward.value} <span class="coin-symbol silver">F</span>
                <small>${reward.type}</small>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
    
    if (userData.cases.rewards.length === 0) {
        historyList.innerHTML = '<div class="no-history">История открытий пуста</div>';
    }
}

// Открытие кейса
function openCase(caseType) {
    const caseConfig = {
        peace: { name: 'Покой в богатстве', min: 50, max: 200 },
        stars67: { name: '67 звезд', min: 100, max: 500 },
        daily: { name: 'Ежедневный кейс', min: 20, max: 100 },
        strike: { name: 'СТРАЙК', min: 300, max: 1000 },
        stars15: { name: '15 звезд', min: 30, max: 150 },
        stars50: { name: '50 звезд', min: 80, max: 400 }
    };
    
    if (!caseConfig[caseType]) return;
    
    const config = caseConfig[caseType];
    const modal = document.getElementById('case-open-modal');
    const openingText = document.getElementById('case-opening-text');
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    modal.scrollTop = 0;
    
    openingText.textContent = 'Открываем кейс...';
    
    // Анимация открытия
    setTimeout(() => {
        openingText.textContent = 'Кейс открывается...';
    }, 1000);
    
    setTimeout(() => {
        openingText.textContent = 'Определяем награду...';
    }, 2000);
    
    // Генерация случайной награды
    setTimeout(() => {
        const rewardValue = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
                const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
        
        // Добавляем награду в историю
        userData.cases.rewards.unshift({
            caseType: config.name,
            value: rewardValue,
            type: rewardType,
            timestamp: new Date().toISOString()
        });
        
        // Ограничиваем историю 20 записями
        if (userData.cases.rewards.length > 20) {
            userData.cases.rewards = userData.cases.rewards.slice(0, 20);
        }
        
        // Сохраняем данные
        saveUserData();
        
        // Показываем результат
        document.querySelector('.case-opening').classList.add('hidden');
        document.querySelector('.case-result').classList.remove('hidden');
        
        document.getElementById('prize-icon').textContent = '💰';
        document.getElementById('prize-name').textContent = `+${rewardValue} <span class="coin-symbol silver">F</span>`;
        document.getElementById('prize-description').textContent = `Кейс: ${config.name}`;
        
        // Обновляем историю
        updateCasesHistory();
    }, 3000);
}

// Закрыть модальное окно кейса
function closeCaseModal() {
    document.getElementById('case-open-modal').style.display = 'none';
    document.querySelector('.case-opening').classList.remove('hidden');
    document.querySelector('.case-result').classList.add('hidden');
}

// Забрать награду из кейса
function claimCasePrize() {
    alert('Награда успешно зачислена на ваш баланс!');
    closeCaseModal();
}

// Очистка игры "Ракетка" при размонтировании
window.addEventListener('beforeunload', () => {
    if (rocketGameState.roundTimer) {
        clearInterval(rocketGameState.roundTimer);
    }
});





// Живые счётчики онлайн на карточках игр
function animateOnlineCounters() {
    const counters = {
        'online-mines': 36,
        'online-rocket': 34,
        'online-roulette': 49
    };
    setInterval(() => {
        Object.entries(counters).forEach(([id, base]) => {
            const el = document.getElementById(id);
            if (el) {
                const delta = Math.floor(Math.random() * 5) - 2;
                const val = Math.max(10, base + delta);
                counters[id] = val;
                el.textContent = val;
            }
        });
    }, 3000);
}
animateOnlineCounters();
