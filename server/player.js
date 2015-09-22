var Card = require('./card');

function Player(clientId, name, section) {
    this.clientId = clientId;
    this.name = name;
    this.hand = [];
    this.crib = null;
    this.section = section;
}

Player.prototype.passToCrib = function(hand) {
    this.section.on('client/donePassToCrib', this.onDonePassToCrib.bind(this));
    this.hand = hand;
    this.crib = null;
    this.section.emit(this.clientId, {
        event: 'passToCrib',
        data: this.hand
    });
};

Player.prototype.makeCribPlayer = function(cribCards) {
    this.crib = [];
    if(cribCards.length === 1) {
        this.crib.push(cribCards[0]);
    }
};

Player.prototype.onDonePassToCrib = function(clientId, passedCards) {
    if(this.clientId === clientId) {
        //cards that are being passed
        passedCards.forEach((function(passedCard) {
            var i = 0;
            var done = false;
            while(!done && i < this.hand.length) {
                if(this.hand[i].same(passedCard)) {
                    this.hand.splice(i,1);
                    done = true;
                }
                i++;
            }
        }).bind(this));
        this.section.emit('player/donePassToCrib');
    }
    if(this.crib !== null) {
        console.log('crib me!');
        console.log(this.hand.length);
        console.log(this.crib.length);
        passedCards.forEach((function(passedCard) {
            this.crib.push(new Card(passedCard)); //using new Card to regain prototype of passedCards. Not sure if needed really
        }).bind(this));
        if(this.crib.length === this.hand.length) {
            console.log('crib sent!');
            this.section.emit(this.clientId, {
                event: 'cribCards',
                data: this.crib.length
            });
        }
    }
};

Player.prototype.cutDeck = function(deck) {
    this.section.emit(this.clientId, {
        event: 'cutDeck',
        data: {
            deckSize: deck.getNumCards()
        }
    });
    this.section.once('client/doneCutDeck', (function(index){
        var cutCard = deck.cutDeck(index);
        this.section.emit('allClients', {
            event: 'cutCard',
            data: cutCard
        });
        this.section.emit('player/cutCard', cutCard);
        this.section.emit('player/doneCutDeck');
    }).bind(this));
};

Player.prototype.cutPoints = function(points) {
//TODO
};

Player.prototype.peg = function(cardCount, callback) {

};

Player.prototype.pegPoints = function(points) {
//TODO
};

Player.prototype.goPoints = function(points) {
//TODO
};

Player.prototype.countHand = function(cutCard) {
//TODO
};

Player.prototype.countCrib = function(cutCard) {
//TODO
};

module.exports = Player;