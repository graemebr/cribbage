var Card = require('./card');

function Player(clientId, name, section) {
    this.clientId = clientId;
    this.name = name;
    this.hand = [];
    this.unpeggedCards = [];
    this.crib = null;
    this.section = section;
    this.points = 0;
    this.team = null;
    this.go = false;
    this.donePegging = false;
}

Player.prototype.passToCrib = function(hand, cribPlayer, cribCards) {
    this.section.on('client/donePassToCrib', this.onDonePassToCrib.bind(this));
    this.hand = hand;
    this.unpeggedCards = hand;
    this.donePegging = false;
    this.crib = null;
    this.section.emit(this.clientId, {
        event: 'passToCrib',
        data: {
            hand: this.hand,
            cribPlayer: cribPlayer.name
        }
    });
    if (this === cribPlayer) {
        this.crib = [];
        if (cribCards.length === 1) {
            this.crib.push(cribCards[0]);
        }
    }
};

Player.prototype.onDonePassToCrib = function(clientId, passedCards) {
    if (this.clientId === clientId) {
        //cards that are being passed
        passedCards.forEach((function(passedCard) {
            var i = 0;
            var done = false;
            while (!done && i < this.hand.length) {
                if (this.hand[i].same(passedCard)) {
                    this.hand.splice(i, 1);
                    done = true;
                }
                i++;
            }
        }).bind(this));
        this.section.emit('player/donePassToCrib');
    }
    if (this.crib !== null) {
        console.log('crib me!');
        console.log(this.hand.length);
        console.log(this.crib.length);
        passedCards.forEach((function(passedCard) {
            this.crib.push(new Card(passedCard)); //using new Card to regain prototype of passedCards. Not sure if needed really
        }).bind(this));
        if (this.crib.length === this.hand.length) {
            console.log('crib sent!');
            this.section.emit(this.clientId, {
                event: 'cribCards',
                data: this.crib.length
            });
        }
    }
};

Player.prototype.cutDeck = function(deck) {
    this.section.emit('allClients', {
        event: 'cutDeck',
        data: {
            deckSize: deck.getNumCards(),
            clientId: this.clientId,
            name: this.name
        }
    });
    this.section.once('client/doneCutDeck', (function(clientId, index) {
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
    this.section.emit('allClients', {
        event: 'addPoints',
        data: {
            team: this.team,
            points: points
        }
    });
    this.points += points;
};

Player.prototype.newPeggingRound = function() {
    this.go = false;
    this.section.emit(this.clientId,{
        event: 'newPeggingRound'
    });
};

Player.prototype.peg = function(cardCount, callback) {
    var allowedCards = [];
    this.unpeggedCards.forEach(function(card) {
        if (card.value + cardCount <= 31) {
            allowedCards.push(card);
        }
    });

    if (allowedCards.length > 0) {

        function pegDone(clientId, card) {
            console.log('chosen card server');
            console.log(card);
            this.unpeggedCards = this.unpeggedCards.filter(function(obj) {
                return !(obj.same(card));
            });
            this.section.emit('allClients', {
                event: 'cardPegged',
                data: card
            });
            callback(new Card(card));
        }
        this.section.once('client/pegDone', pegDone.bind(this));

        this.section.emit('allClients', {
            event: 'peg',
            data: {
                allowedCards: allowedCards,
                clientId: this.clientId,
                name: this.name
            }
        });
    } else {
        if (!this.go) {
            this.go = true;
            console.log('player/player go, ' + this.name);
            this.section.emit('player/go');
            if (this.unpeggedCards.length === 0 && !this.donePegging) {
                this.donePegging = true;
                console.log('player/player donePegging, ' + this.name);
                this.section.emit('player/donePegging');
            }
        }
        this.section.emit('player/finishedPegAction');
    }
};

Player.prototype.pegPoints = function(points) {
    this.cutPoints(points);
    this.section.emit('player/finishedPegAction');
};

Player.prototype.goPoints = function(points) {
    console.log('go points: ' + points);
    this.cutPoints(points);
};

Player.prototype.countHand = function(cutCard) {
    //TODO
};

Player.prototype.countCrib = function(cutCard) {
    //TODO
};

module.exports = Player;