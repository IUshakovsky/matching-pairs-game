// TODO:
// - комментарии
// - рефакторинг
// - логика хода робота el.dispatchEvent(new Event('click'));
// - доделать стили 
// - реализовать уровни сложности - процент "запоминания" 
// - сайт на github
// - как использовать для обучения/запоминания?

// количество 24(4x6), 28(4x7), 30(5x6), 40(5x8), 50(5x10)

const SRC_COVER = 'icons/cover.png';
const ICONS_AMNT = 29;

const elContainer = document.querySelector('.container');
const elSliderAmnt = document.querySelector('#s_tiles_amnt');
const elSliderLevel = document.querySelector('#s_level');
const elMsg = document.querySelector('#message');
const elBtnStart = document.querySelector('#btn_start');


window.onload = () =>  { 
    let game = new Game();
    elSliderAmnt.addEventListener('input', game.setAmntVal.bind(game));
    elSliderLevel.addEventListener('input', game.setLevelVal.bind(game));
    elBtnStart.addEventListener('click', game.party.start.bind(game.party));
    game.setAmntVal();
    game.setLevelVal();
}


class Game {
    constructor(){
        this.party = new Party();
    }

    setLevel(level){
        this.level = level;
    }

    setLevelVal(){
        let el = document.querySelector('#level_config');
        el.value = elSliderLevel.value;
        let level = parseInt(elSliderLevel.value);
        this.setLevel(level);
    }

    setAmntVal(){
        let el = document.querySelector('#tiles_config');
        el.value = elSliderAmnt.value;
        let amnt = parseInt(elSliderAmnt.value);
        this.setField(amnt);
        this.party.setPartyField(this.field);

    }

    initializeImgs(){
        // Sequence of ints from 1 to 29
        let allIconIds = Array.from({length:ICONS_AMNT},(_,i)=>i+1);
        
        // Shuffle
        this.shuffleArray(allIconIds);

        // Random choice of image indexes
        this.imgInds = []
        for(let i=0; i<this.field.rows * this.field.cols / 2; i++){
            let nextIndex = allIconIds.pop();
            this.imgInds.push(nextIndex);
            this.imgInds.push(nextIndex);  
        } 

        // Shuffle 
        this.shuffleArray(this.imgInds);
        console.log(this.imgInds);
    }

    setField(size){
        let x = 0;
        let y = 0;
        switch(size){
            case 1:
                x = 6;
                y = 4;
                break;
            case 2:
                x = 7;
                y = 4;
                break;
            case 3:
                x = 6;
                y = 5;
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
            pairs: x * y /2
        };

        this.initializeImgs();    
        this.createTiles();
    }

    createTiles(){
        elContainer.textContent = '';

        for (let i = 1; i <= this.field.cols; i++){
            for(let j = 1; j <= this.field.rows; j++)
            {
                this.createSingleTile(i,j);
            }
        }

        elContainer.style.setProperty('grid-template-rows', `repeat(${this.field.cols}, 1fr)`);
        elContainer.style.setProperty('grid-template-columns', `repeat(${this.field.rows}, 1fr)`);
    }

    createSingleTile(col ,row){
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
        el_tile.addEventListener('click',this.party.processMove.bind(this.party))
    
        elContainer.appendChild(el_tile);
    }
    
    shuffleArray(arr){
        arr.sort( () => Math.random() - 0.5 );
    }

}

moveStatus = {
    ready:          0,
    in_progress:    1,
    idle:           2
}

class Party {

    constructor(){
        this.humanPlayer = new Human();
        this.robotPlayer = new Robot();
        this.currentPlayer = new Player();

        this.moveStatus = moveStatus.ready;
        this.selectedElements = [];
        this.started = false;
    }

    setPartyField(field){
        this.pairsLeft = field.pairs;
        this.robotPlayer.updFieldInfo(field);
    }

    processMove(e){
        if (!this.started ){ //|| this.robotMoving
            return; 
        }

        let e_in = e.currentTarget; 

        switch (this.moveStatus){
            case moveStatus.ready:
                e_in.querySelector('.flip-card-inner').classList.toggle('flip')
                this.moveStatus = moveStatus.in_progress;
                this.selectedElements.push(e_in);
                break;

            case moveStatus.in_progress:
                if (e_in === this.selectedElements[0]){
                    return;
                }
                e_in.querySelector('.flip-card-inner').classList.toggle('flip')
                this.moveStatus = moveStatus.idle;
                this.selectedElements.push(e_in);
               
                setTimeout(() => {
                    this.selectedElements.forEach(element => {
                        element.querySelector('.flip-card-inner').classList.toggle('flip')
                    });
                    this.moveStatus = moveStatus.ready;
                    this.selectedElements = [];
                    this.changePlayer();
                }, 2000 );
                
                this.checkResult();
                break;
            case moveStatus.idle:
                break;
       }
    }

    checkResult(){
        let moveData = {};
        this.selectedElements.forEach(element => {
            moveData[element.id] = element.dataset.img_id;
        });
        let mode;

        if (this.selectedElements[0].dataset.img_id == this.selectedElements[1].dataset.img_id){
            setTimeout(() => {
                this.selectedElements.forEach(element => {
                    element.style.visibility = 'hidden';
                })
                this.selectedElements = []; 
                this.currentPlayer.addPoint();
                this.moveStatus = moveStatus.ready;
                this.changePlayer();
            }, 1000);
            mode = 'R'; // remove
        } else {
            mode = 'O'; // open
        }

        this.robotPlayer.updateMemory({ mode: mode,
                                        moveData: moveData 
        }); 

    }

    start(){
        this.randomChooseFirst();
        this.started = true;

        // while (this.pairsLeft > 0){
        //     this.currentPlayer.makeMove();
        //     // this.checkResult();
        //     this.changePlayer();
        // }
        // this.defineWinner();
    }

    changePlayer(){
        this.currentPlayer = ( this.currentPlayer === this.humanPlayer ) ? this.robotPlayer : this.humanPlayer;
        this.prepareForMove();
    }

    prepareForMove(){
        if (this.currentPlayer === this.humanPlayer){
            elMsg.style.visibility = 'visible';
            this.robotMoving = false;
        } else {
            elMsg.style.visibility = 'hidden';
            this.robotMoving = true;
        }
        this.currentPlayer.makeMove();
        // elMsg.style.visibility = (this.currentPlayer === this.humanPlayer) ?  'visible' : 'hidden';
        // this.humanMoving = !this.humanMoving;
    }

    randomChooseFirst(){   
        this.currentPlayer = ( Math.round( Math.random() ) ) ? this.humanPlayer : this.robotPlayer;
        console.log(this.currentPlayer);
        this.prepareForMove();
    }

}

class Player {
    constructor(){
        this.score = 0;
    }

    addPoint(){
        this.score += 1;
    }

    makeMove(){
        
    }
}

class Robot extends Player {
    makeMove(){
        console.log('My robo move!');
        this.makeRandomMove();
    }

    updFieldInfo(field){
        this.field = field;
        this.initMyMemory();
    }

    makeRandomMove(){
        let i = 0;
        while(i<2){
            let el_id = this.unknownTiles[Math.floor(Math.random() * this.unknownTiles.length)]
            document.querySelector(`#${el_id}`).dispatchEvent(new Event('click'));
            i++;
        }
    }

    updateMemory(data){
        switch (data.mode){
            case 'O':
                this.knownTiles = {...this.knownTiles, ...data.moveData};
                for (let key in data.moveData){
                    this.unknownTiles = this.unknownTiles.filter( val => val != key  );
                }
                break;
            
            case 'R':
                break;            
        }
    }

    initMyMemory(){
        this.knownTiles = {};
        this.unknownTiles = [];
        for(let i=1; i<=this.field.cols; i++){
            for(let j=1; j<=this.field.rows; j++){
                this.unknownTiles.push(`t_${i}_${j}`)
            }
        }
    }
}

class Human extends Player {
    // makeMove(){

    // }
}