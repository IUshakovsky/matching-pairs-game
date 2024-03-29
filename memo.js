// TODO:
// - рефакторинг

const SRC_COVER = 'icons/cover.png';
const ICONS_AMNT = 29;

const elContainer = document.querySelector('.container');
const elSliderAmnt = document.querySelector('#s_tiles_amnt');
const elSliderLevel = document.querySelector('#s_level');
const elMsg = document.querySelector('#message');
const elScoreboard = document.querySelector('#scoreboard');
const elSettings = document.querySelector('.settings');
const elStatusBar = document.querySelector('#status_bar');
const elResult = document.querySelector('#result');

const FieldSize = {
    1: 'tiny',
    2: 'small',
    3: 'medium',
    4: 'large',
    5: 'hudge'
}

const RobotLevel = {
    1: 'junior',
    2: 'middle',
    3: 'senior',
    4: 'lead'
    // 5: 'boss'
}

function shuffleArray(arr) {
    arr.sort(() => Math.random() - 0.5);
}

function fiftyFifty(){
    return Math.random() > 0.5 ? true : false;
}

window.onload = () => {
    let game = new Game();
    elSliderAmnt.addEventListener('input', game.setAmntVal.bind(game));
    elSliderLevel.addEventListener('input', game.setLevelVal.bind(game));
    let elBtnStart = document.querySelector('#btn_start');
    elBtnStart.addEventListener('click', game.party.start.bind(game.party));

    let elBtnRestart = document.querySelector('#btn_restart');
    elBtnRestart.addEventListener('click', () => window.location.reload(false))
    game.setAmntVal();
    game.setLevelVal();
}

class Game {
    constructor() {
        this.party = new Party();
    }

    setLevel(level) {
        this.party.setLevel(level);
    }

    setLevelVal() {
        let elLevel = document.querySelector('#level_config');
        let elLevelStatus = document.querySelector('#status_level');
        elLevel.value = RobotLevel[elSliderLevel.value];
        elLevelStatus.textContent = RobotLevel[elSliderLevel.value];
        let level = parseInt(elSliderLevel.value);
        this.setLevel(level);
    }

    setAmntVal() {
        let elFieldSize = document.querySelector('#tiles_config');
        let elFieldSizeStatus = document.querySelector('#status_field');
        elFieldSize.value = FieldSize[elSliderAmnt.value];
        elFieldSizeStatus.textContent = FieldSize[elSliderAmnt.value];
        let amnt = parseInt(elSliderAmnt.value);
        this.setField(amnt);
        this.party.setPartyField(this.field);
    }

    initializeImgs() {
        // Sequence of ints from 1 to 29
        let allIconIds = Array.from({ length: ICONS_AMNT }, (_, i) => i + 1);

        // Shuffle
        shuffleArray(allIconIds);

        // Random choice of image indexes
        this.imgInds = []
        for (let i = 0; i < this.field.rows * this.field.cols / 2; i++) {
            let nextIndex = allIconIds.pop();
            this.imgInds.push(nextIndex);
            this.imgInds.push(nextIndex);
        }

        // Shuffle 
        shuffleArray(this.imgInds);
    }

    setField(size) {
        let x = 0;
        let y = 0;
        switch (size) {
            case 1:
                x = 6;
                y = 4;
                break;
            case 2:
                x = 7;
                y = 4;
                break;
            case 3:
                x = 8;
                y = 4;
                break;
            case 4:
                x = 8;
                y = 5;
                break;
            case 5:
                x = 10;
                y = 5;
                break;
        };

        this.field = {
            size: size,
            rows: x,
            cols: y,
            pairs: x * y / 2
        };

        let newMaxWidthVH = Math.round(85 * (x / (1.4 * y)) - 2);
        elContainer.style.setProperty('max-width', `${newMaxWidthVH}vh`);
        this.initializeImgs();
        this.createTiles();
    }

    createTiles() {
        elContainer.textContent = '';

        for (let i = 1; i <= this.field.cols; i++) {
            for (let j = 1; j <= this.field.rows; j++) {
                this.createSingleTile(i, j);
            }
        }

        elContainer.style.setProperty('grid-template-rows', `repeat(${this.field.cols}, 1fr)`);
        elContainer.style.setProperty('grid-template-columns', `repeat(${this.field.rows}, 1fr)`);
    }

    createSingleTile(col, row) {
        let el_tile = document.createElement('div');
        el_tile.id = `t_${col}_${row}`;
        el_tile.className = 'tile';

        let el_card_inner = document.createElement('div');
        el_card_inner.className = 'flip-card-inner';

        let el_card_front = document.createElement('div');
        el_card_front.className = 'flip-card-front';
        el_card_inner.appendChild(el_card_front);

        let el_cover = document.createElement('img');
        el_cover.src = SRC_COVER;
        el_cover.className = 'image';
        el_card_front.appendChild(el_cover);

        let el_card_back = document.createElement('div');
        el_card_back.className = 'flip-card-back';
        el_card_inner.appendChild(el_card_back);

        let el_card_item = document.createElement('img');
        let img_id = this.imgInds.pop()
        el_card_item.src = `icons/icn${img_id}.png`
        el_card_item.className = 'image';

        el_tile.dataset.img_id = img_id

        el_card_back.appendChild(el_card_item);

        el_tile.appendChild(el_card_inner)
        el_tile.addEventListener('click', this.party.processMove.bind(this.party))

        elContainer.appendChild(el_tile);
    }
}

moveStatus = {
    ready: 0,
    in_progress: 1,
    idle: 2
}

class Party {

    constructor() {
        this.humanPlayer = new Human('human_score');
        this.robotPlayer = new Robot('robot_score');
        this.currentPlayer = new Player();

        this.moveStatus = moveStatus.ready;
        this.selectedElements = [];
        this.started = false;
    }

    setPartyField(field) {
        this.pairsLeft = field.pairs;
        this.robotPlayer.updFieldInfo(field);
    }

    setLevel(level) {
        this.robotPlayer.setLevel(level);
    }

    processMove(e) {
        if (!this.started || (this.robotMoving && e.pointerType == 'mouse')) {
            return;
        }

        let e_in = e.currentTarget;

        switch (this.moveStatus) {
            case moveStatus.ready:
                e_in.querySelector('.flip-card-inner').classList.toggle('flip')
                this.moveStatus = moveStatus.in_progress;
                this.selectedElements.push(e_in);
                break;

            case moveStatus.in_progress:
                if (e_in === this.selectedElements[0]) {
                    return;
                }
                e_in.querySelector('.flip-card-inner').classList.toggle('flip')
                this.moveStatus = moveStatus.idle;
                this.selectedElements.push(e_in);

                setTimeout(() => {
                    this.selectedElements.forEach(element => {
                        element.querySelector('.flip-card-inner').classList.toggle('flip')
                    });
                    this.checkResult();
                    this.moveStatus = moveStatus.ready;
                    this.selectedElements = [];
                    if (this.started) {
                        this.changePlayer();
                    }
                }, 2000);

                break;
            case moveStatus.idle:
                break;
        }
    }

    checkResult() {
        let moveData = {};
        this.selectedElements.forEach(element => {
            moveData[element.id] = element.dataset.img_id;
        });
        let mode;

        if (this.selectedElements[0].dataset.img_id == this.selectedElements[1].dataset.img_id) {
            this.selectedElements.forEach(element => {
                element.style.visibility = 'hidden';
            })
            this.selectedElements = [];
            this.currentPlayer.addPoint();
            this.pairsLeft--;
            if (this.pairsLeft == 0) {
                this.finish();
                return;
            }
            this.moveStatus = moveStatus.ready;
            mode = 'R'; // remove
        } else {
            mode = 'O'; // open
        }

        this.robotPlayer.updateMemory({
            mode: mode,
            moveData: moveData
        });

    }

    start() {
        this.started = true;
        this.randomChooseFirst();
        elScoreboard.style.visibility = 'visible';
        elSettings.style.display = 'none';
        elStatusBar.style.visibility = 'visible';
    }

    finish() {
        this.started = false;
        elMsg.style.visibility = 'hidden';
        elContainer.style.display = 'none';
        elResult.style.display = 'block';
        elResult.querySelector('#result_msg').innerText = `Game over. ${this.getResultMessage()}`;
    }

    getResultMessage() {
        if (this.humanPlayer.score == this.robotPlayer.score) {
            return 'Draw';
        } else {
            let state;
            if (this.humanPlayer.score < this.robotPlayer.score) {
                state = 'lose';
            } else {
                state = 'win';
            }
            return `You ${state}`;
        }
    }

    changePlayer() {
        this.currentPlayer = (this.currentPlayer === this.humanPlayer) ? this.robotPlayer : this.humanPlayer;
        this.prepareForMove();
    }

    prepareForMove() {
        if (this.currentPlayer === this.humanPlayer) {
            elMsg.style.visibility = 'visible';
            this.robotMoving = false;
        } else {
            elMsg.style.visibility = 'hidden';
            this.robotMoving = true;
        }
        this.currentPlayer.makeMove();
    }

    randomChooseFirst() {
        this.currentPlayer = (Math.round(Math.random())) ? this.humanPlayer : this.robotPlayer;
        this.prepareForMove();
    }
}

class Player {
    constructor(scoreboard_id) {
        this.score = 0;
        this.scoreboard_id = scoreboard_id;
    }

    addPoint() {
        this.score += 1;
        document.querySelector(`#${this.scoreboard_id}`).textContent = this.score;
    }

    makeMove() {
    }
}

class Robot extends Player {
    makeMove() {
        // let tempFoundPairs = this.reduceArrayByLevel(this.foundPairs)
        let foundPair = this.getFoundPairByLevel(); 
        if (foundPair != undefined) {
            foundPair.forEach(element => {
                this.clickTile(element);
            });
        } else {
            this.makeRandomMove();
        }
    }

    setLevel(level) {
        switch (level) {
            case 1:
                this.levelMemoryKoef = 0.1;
                break;
            case 2:
                this.levelMemoryKoef = 0.3;
                break;
            case 3:
                this.levelMemoryKoef = 0.6;
                break;
            case 4:
                this.levelMemoryKoef = 0.8;
                break;
            // case 5:
            //     this.levelMemoryKoef = 1;
            //     break;
        }
        console.log(this.levelMemoryKoef)
    }

    updFieldInfo(field) {
        this.field = field;
        this.initMyMemory();
    }

    clickTile(tile_id) {
        setTimeout(() => {
            document.querySelector(`#${tile_id}`).dispatchEvent(new Event('click'));
        }, 1000);
    }

    getRandIndex(prevElIndex) {
        let randomTileId;
        let randIndex;
        
        if ( this.unknownTiles.length > 0  ){
            console.log('reading from unknown tiles')
            if ( this.unknownTiles.length == 1 && prevElIndex != undefined ) {
                prevElIndex = undefined;
            } else {
                randIndex =  Math.floor(Math.random() * this.unknownTiles.length);
                console.log(prevElIndex, randIndex)
                if (randIndex == prevElIndex) {
                    randIndex = this.unknownTiles.length % (randIndex + 1);
                    console.log('same, found another', randIndex, this.unknownTiles.length)
                }
                randomTileId = this.unknownTiles[randIndex];
                return [randIndex, randomTileId];
            }
        } 
        
        let knownKeys = Object.keys(this.knownTiles);
        if ( knownKeys.length > 0 ) {
            if ( knownKeys.length == 1 && prevElIndex != undefined ) {
                prevElIndex = undefined;
            } else {
                randIndex =  Math.floor(Math.random() * knownKeys.length);
                if (randIndex == prevElIndex) {
                    randIndex = knownKeys.length % (randIndex + 1);
                }
                randomTileId = knownKeys[randIndex];
                console.log(randomTileId, 'from known tiles')
                return [randIndex, randomTileId]; 
            }
        } 
        
        else {
            let tilesFromPairs = [];
            for (let pair of this.foundPairs){
                tilesFromPairs = tilesFromPairs.concat(pair);
            }
            randIndex = Math.floor(Math.random() * tilesFromPairs.length);
            if (randIndex == prevElIndex) {
                randIndex = tilesFromPairs.length % (randIndex + 1);
            }
            randomTileId = tilesFromPairs[randIndex];
            return [randIndex, randomTileId];
        }
    }

    makeRandomMove() {
        let [randomElIndex, randomTileId] = this.getRandIndex(undefined);
        let img_id;
        this.clickTileAs(randomTileId).then((x) => {
            img_id = x;
            let pair_id = this.checkInMemory(randomTileId, img_id, true);
            if (pair_id != '') {
                this.clickTile(pair_id);
            } else {
                [randomElIndex, randomTileId] = this.getRandIndex(randomElIndex);
                this.clickTile(randomTileId);
            }
        });
    }

    updateMemory(data) {
        switch (data.mode) {
            case 'O':
                for (let key in data.moveData) {
                    this.unknownTiles = this.unknownTiles.filter(val => val != key);
                    let secondKey = this.checkInMemory(key, data.moveData[key]);
                    if (secondKey != '') {
                        this.foundPairs.push([key, secondKey]);
                    } else {
                        this.knownTiles[key] = data.moveData[key];
                    }
                }
                break;

            case 'R':
                for (let key in data.moveData) {
                    this.unknownTiles = this.unknownTiles.filter(val => val != key);
                    delete this.knownTiles[key];
                    this.foundPairs = this.foundPairs.filter(item => item[0] != key || item[1] != key);
                }
                break;
        }
    }

    reduceArrayByLevel(arr) {
        let newArr = arr;
        let newLen = Math.floor(newArr.length * this.levelMemoryKoef);
        if (newLen > 1 || fiftyFifty()) {
            shuffleArray(newArr);
            newArr = newArr.slice(0, newLen);
        }
        return newArr;
    }

    getFoundPairByLevel(){
        if (this.foundPairs.length > 0){
            if (Math.random() < this.levelMemoryKoef){
                return this.foundPairs.pop();
            } else {
                console.log('There are found pairs, but I dont remember')
                return undefined;
            }
        }
    }

    checkInMemory(key, value, isMoving = false) {
        if (Object.entries(this.knownTiles).length === 0) {
            return '';
        }

        let currKnownTilesKeys = Object.keys(this.knownTiles);

        // Use level memory koefficient in moving mode
        if (isMoving) {
            currKnownTilesKeys = this.reduceArrayByLevel(currKnownTilesKeys);
        }

        for (let i in currKnownTilesKeys) {
            let knownKey = currKnownTilesKeys[i];
            if (this.knownTiles[knownKey] == value && knownKey != key && !this.checkInFoundPairs(key)) {
                return knownKey;
            }
        }
        return '';
    }

    checkInFoundPairs(key) {
        this.foundPairs.forEach(pair => {
            if (pair[0] == key || pair[1] == key) {
                return true;
            }
        });
        return false;
    }

    initMyMemory() {
        this.knownTiles = {};
        this.unknownTiles = [];
        this.foundPairs = [];

        for (let i = 1; i <= this.field.cols; i++) {
            for (let j = 1; j <= this.field.rows; j++) {
                this.unknownTiles.push(`t_${i}_${j}`);
            }
        }
    }

    async clickTileAs(tile_id) {
        let pr = new Promise((resolve, reject) =>
            setTimeout(() => {
                let target = document.querySelector(`#${tile_id}`);
                target.dispatchEvent(new Event('click'));
                resolve(target.dataset.img_id);
            }, 1000)
        );
        let result = await pr;
        return result;
    }
}

class Human extends Player {
}