function Player(clientId, name) {
    this.clientId = clientId;
    this.name = name;
    this.hand = [];
    this.crib = null;
}

Player.prototype.setSection = function(section) {
    this.section = section;
    this.section.on('client/donePassToCrib', this.onDonePassToCrib.bind(this));
};

Player.prototype.passToCrib = function(hand) {
    this.hand = hand;
    this.crib = null;
    this.section.emit(this.clientId, {
        event: 'passToCrib',
        data: {
            hand: this.hand
        }
    });
};

Player.prototype.makeCribPlayer = function() {
    this.crib = [];
};

Player.prototype.onDonePassToCrib = function(clientId, passedCards) {
    if(this.clientId === clientId) {
        //cards that are being passed
        passedCards.forEach((function(passedCard) {
            var i = 0;
            var done = false;
            while(!done && i < this.hand.length) {
                if(this.hand[i].same(passedCard)) {
                    this.hand.splice(1,i);
                    done = true;
                }
                i++;
            }
        }).bind(this));
        this.section.emit('player/donePassToCrib');
    }
    if(this.crib !== null) {
        passedCards.forEach((function(passedCard) {
            this.crib.push(new Card(passedCard)); //using new Card to regain prototype of passedCards. Not sure if needed really
        }).bind(this));
    }
};

Player.prototype.cutDeck = function(deck) {
    this.section.emit(this.clientId, {
        event: 'cutDeck',
        data: {
            deckSize: this.hand.getNumCards()
        }
    });
    this.section.once('client/doneCutDeck', (function(index){
        var cutCard = deck.cutDeck(index);
        this.section.emit('player/cutCard', cutCard);
        this.section.emit('player/doneCutDeck');
    }).bind(this));
};

Player.prototype.cutPoints = function(points) {
//TODO
};

Player.prototype.peg = function(cardCount, callback) {
//TODO
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