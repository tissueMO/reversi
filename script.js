document.addEventListener('DOMContentLoaded', () => {
    const boardSize = 8;
    const gameBoard = document.getElementById('game-board');
    const currentPlayerDisplay = document.getElementById('current-player');
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const restartButton = document.getElementById('restart-button');
    let currentPlayer = 'black';
    let board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

    restartButton.addEventListener('click', restartGame);

    // Initialize the game board
    function initializeBoard() {
        gameBoard.innerHTML = '';
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', handleCellClick);
                gameBoard.appendChild(cell);
            }
        }
        placePiece(3, 3, 'white');
        placePiece(3, 4, 'black');
        placePiece(4, 3, 'black');
        placePiece(4, 4, 'white');
        currentPlayer = 'black';
        updateCurrentPlayerDisplay();
    }

    function placePiece(row, col, color) {
        const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        if (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
        const piece = document.createElement('div');
        piece.classList.add('piece', color);
        cell.appendChild(piece);
        board[row][col] = color;
    }

    function handleCellClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        if (isValidMove(row, col, currentPlayer)) {
            makeMove(row, col, currentPlayer);
            currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
            updateCurrentPlayerDisplay();
            if (!hasValidMove(currentPlayer)) {
                currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
                updateCurrentPlayerDisplay();
                if (!hasValidMove(currentPlayer)) {
                    endGame();
                }
            }
        }
    }

    function isValidMove(row, col, color) {
        if (board[row][col] !== null) return false;
        return getFlippablePieces(row, col, color).length > 0;
    }

    function getFlippablePieces(row, col, color) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        let flippable = [];
        for (let [dx, dy] of directions) {
            let x = row + dx, y = col + dy;
            let pieces = [];
            while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && board[x][y] && board[x][y] !== color) {
                pieces.push([x, y]);
                x += dx;
                y += dy;
            }
            if (x >= 0 && x < boardSize && y >= 0 && y < boardSize && board[x][y] === color) {
                flippable = flippable.concat(pieces);
            }
        }
        return flippable;
    }

    function makeMove(row, col, color) {
        const flippable = getFlippablePieces(row, col, color);
        placePiece(row, col, color);
        for (let [x, y] of flippable) {
            placePiece(x, y, color);
        }
    }

    function hasValidMove(color) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (isValidMove(row, col, color)) {
                    return true;
                }
            }
        }
        return false;
    }

    function endGame() {
        let blackCount = 0, whiteCount = 0;
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (board[row][col] === 'black') blackCount++;
                if (board[row][col] === 'white') whiteCount++;
            }
        }
        resultMessage.textContent = `ゲーム終了！ 黒: ${blackCount}, 白: ${whiteCount}. ${blackCount > whiteCount ? '黒の勝ち！' : '白の勝ち！'}`;
        resultModal.style.display = 'block';
    }

    function updateCurrentPlayerDisplay() {
        currentPlayerDisplay.textContent = `現在の手番: ${currentPlayer === 'black' ? '黒' : '白'}`;
    }

    function restartGame() {
        board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        resultModal.style.display = 'none';
        initializeBoard();
    }

    initializeBoard();
});
