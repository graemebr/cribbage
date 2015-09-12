var Deck = require('./deck');

function GameLogic(section, teamsList) {
    this.section = section;

    this.roundPlayers = [];
    for (var i = 0, length = teamsList[0].getNumPlayers(); i < length; i++) {
        for (var j = 0; j < teamsList.length; j++) {
            roundPlayers.push(teamsList[j].pop());
        }
    }
    this.lastIndex = 0;
    this.cribIndex = 0;
    this.goIndex = 0;

    this.cutCard = null;
    this.pegCount = 0;
    this.pegCardList = [];

    this.section.on('game/startGame', this.passToCrib().bind(this));

    this.waitForPlayersToSend('player/donePassToCrib', this.cutDeck);

    this.section.on('player/cutCard', this.onCutCard.bind(this));
    this.section.on('player/doneCutDeck', this.pegging.bind(this));

    this.boundPegAction = this.pegAction.bind(this);
    this.waitForPlayersToSend('player/donePegging', this.onDonePegging.bind(this));
    this.waitForPlayersToSend('player/go', this.onGo.bind(this));

    this.waitForPlayersToSend('player/doneCounting', this.cribCounting.bind(this));
    this.boundCountNextPlayer = this.countNextPlayer.bind(this);
    this.section.on('player/doneCribCounting', this.passToCrib().bind(this));
}

GameLogic.prototype.nextIndex = function(index) {
    return (index + 1) % this.roundPlayers.length;
};

GameLogic.prototype.getCribPlayer = function() {
    return this.roundPlayers[cribIndex];
};

GameLogic.prototype.getFirstPlayer = function() {
    var firstIndex = this.nextIndex(this.cribIndex);
    return  this.roundPlayers[firstIndex];
};

GameLogic.prototype.getNextPlayer = function() {
    var nextIndex = this.nextIndex(lastIndex);
    this.lastIndex = nextIndex;
    return this.roundPlayers[nextIndex];
};

GameLogic.prototype.getGoPlayer = function() {
    return  this.roundPlayers[goIndex];
};


GameLogic.prototype.passToCrib = function() {
    this.deck = new Deck();
    this.deck.shuffle();

    this.cribIndex = this.nextIndex(this.cribIndex);
    this.lastIndex = this.cribIndex;

    this.roundPlayers.forEach(function(player) {
        //send players their hands
        player.passToCrib(this.deck.dealHand());
    });
    this.roundPlayers[cribIndex].makeCribPlayer();

};

GameLogic.prototype.cutDeck = function() {
    this.getFirstPlayer().cutDeck(this.deck);
};

GameLogic.prototype.onCutCard = function(card) {
    this.cutCard = card;

    //TODO: calculate point options
    var pointOptions = {};

    this.getCribPlayer().cutPoints(pointOptions);
};

GameLogic.prototype.pegging = function() {
    this.section.on('player/finishedPegAction', this.boundPegAction);
    this.setupPeggingRound();
    this.pegAction();
};

GameLogic.prototype.onDonePegging = function() {
    this.section.removeListener('player/finishedPegAction', this.boundPegAction);
    this.counting();
};

GameLogic.prototype.setupPeggingRound = function() {
    this.count = 0;
    this.cardList = [];
};

GameLogic.prototype.onGo = function() {
    this.getGoPlayer().goPoints(1);
    this.lastIndex = this.goIndex;
    this.setupPeggingRound();
};

GameLogic.prototype.pegAction = function() {
    var player = this.getNextPlayer();
    player.peg(this.count, (function(card) {
        this.count += card.value;
        this.cardList.push(card);
        this.goIndex = this.lastIndex;
        player.pegPoints(this.getPegPoints());
    }).bind(this));
};

GameLogic.prototype.getPegPoints = function() {
    //TODO: calculate points for top card in cardList
    return {};
};

GameLogic.prototype.counting = function() {
    this.lastIndex = this.cribIndex;
    this.section.on('player/doneCounting', this.boundCountNextPlayer);
    this.countNextPlayer();
};

GameLogic.prototype.countNextPlayer = function() {
    this.getNextPlayer().countHand(this.cutCard);

};

GameLogic.prototype.cribCounting = function() {
    this.section.removeListener('player/doneCounting', this.boundCountNextPlayer);
    this.getCribPlayer().countCrib(this.cutCard);
};

GameLogic.prototype.waitForPlayersToSend = function(event, func) {
    var numPlayersDone = 0;
    var numPlayers = this.roundPlayers.length;

    function callBack() {
        numPlayersDone++;
        if (numPlayersDone === numPlayers) {
            numPlayersDone = 0;
            func();
        }
    }
    this.section.on(event, callBack.bind(this));
};

module.exports = GameLogic;