var Deck = require('./deck');

function GameLogic(section, teamsList) {
    this.section = section;

    this.roundPlayers = [];

    for (var k = 0; k < teamsList.length; k++) {
        if (teamsList[k].getNumPlayers() === 0) {
            teamsList.splice(k, 1);
        }
    }
    for (var i = 0, length = teamsList[0].getNumPlayers(); i < length; i++) {
        for (var j = 0; j < teamsList.length; j++) {
            this.roundPlayers.push(teamsList[j].players[i]);
        }
    }

    this.lastIndex = 0;
    this.cribIndex = 0;
    this.goIndex = 0;

    this.cutCard = null;
    this.count = 0;
    this.cardList = [];

    this.section.on('game/startGame', this.startGame.bind(this));
    this.waitForPlayersToSend('client/assetsLoaded', this.passToCrib.bind(this));

    this.waitForPlayersToSend('player/donePassToCrib', this.cutDeck.bind(this));

    this.section.on('player/cutCard', this.onCutCard.bind(this));
    this.section.on('player/doneCutDeck', this.pegging.bind(this));

    this.boundPegAction = this.pegAction.bind(this);
    this.waitForPlayersToSend('player/donePegging', this.onDonePegging.bind(this));
    this.waitForPlayersToSend('player/go', this.onGo.bind(this));

    this.waitForPlayersToSend('player/doneCounting', this.cribCounting.bind(this));
    this.boundCountNextPlayer = this.countNextPlayer.bind(this);
    this.section.on('player/doneCribCounting', this.passToCrib.bind(this));
}

GameLogic.prototype.startGame = function() {
    this.section.emit('allClients', {
        event: 'loadAssets',
        data: (new Deck()).cards
    });
};

GameLogic.prototype.nextIndex = function(index) {
    return (index + 1) % this.roundPlayers.length;
};

GameLogic.prototype.getCribPlayer = function() {
    return this.roundPlayers[this.cribIndex];
};

GameLogic.prototype.getFirstPlayer = function() {
    var firstIndex = this.nextIndex(this.cribIndex);
    return this.roundPlayers[firstIndex];
};

GameLogic.prototype.getNextPlayer = function() {
    var nextIndex = this.nextIndex(this.lastIndex);
    this.lastIndex = nextIndex;
    return this.roundPlayers[nextIndex];
};

GameLogic.prototype.getGoPlayer = function() {
    return this.roundPlayers[this.goIndex];
};


GameLogic.prototype.passToCrib = function() {
    console.log('assetsLoaded');
    this.deck = new Deck();
    this.deck.shuffle();

    this.cribIndex = this.nextIndex(this.cribIndex);
    this.lastIndex = this.cribIndex;

    var numCards = 5;
    if (this.roundPlayers.length === 2) {
        numCards = 6;
    }
    var dealCardsToCrib = 0;
    if (this.roundPlayers.length === 3) {
        dealCardsToCrib = 1;
    }
    var deltCribCards = this.deck.dealHand(dealCardsToCrib);
    this.roundPlayers.forEach((function(player) {
        //send players their hands
        player.passToCrib(this.deck.dealHand(numCards), this.roundPlayers[this.cribIndex], deltCribCards);
    }).bind(this));

};

GameLogic.prototype.cutDeck = function() {
    console.log('cut the deck');
    this.getFirstPlayer().cutDeck(this.deck);
};

GameLogic.prototype.onCutCard = function(card) {
    this.cutCard = card;

    var points = 0;
    if (card.number === 'jack') {
        points += 2;
    }

    this.getCribPlayer().cutPoints(points);
};

GameLogic.prototype.pegging = function() {
    console.log('pegging');
    this.section.on('player/finishedPegAction', this.boundPegAction);
    this.setupPeggingRound();
    this.pegAction();
};

GameLogic.prototype.onDonePegging = function() {
    console.log('donePegging');
    this.section.removeListener('player/finishedPegAction', this.boundPegAction);
    this.counting();
};

GameLogic.prototype.setupPeggingRound = function() {
    this.count = 0;
    this.cardList = [];
    this.roundPlayers.forEach(function(player) {
        //send players their hands
        player.newPeggingRound();
    });
};

GameLogic.prototype.onGo = function() {
    console.log('go, player ' + this.getGoPlayer().name);
    this.getGoPlayer().goPoints(1);
    this.lastIndex = this.goIndex;
    this.setupPeggingRound();
};

GameLogic.prototype.pegAction = function() {
    var player = this.getNextPlayer();
    console.log('peg action, player ' + player.name);
    player.peg(this.count, (function(card) {
        console.log('card pegged, player: ' + player.name);
        this.count += card.value;
        this.cardList.push(card);
        this.goIndex = this.lastIndex;
        player.pegPoints(this.getPegPoints());
    }).bind(this));
};

GameLogic.prototype.countPairsR = function(index, count) {
    if (index >= 0 && this.cardList[index].sameNumber(this.cardList[index + 1])) {
        return this.countPairsR(index - 1, count + 1);
    }
    return count;
};

GameLogic.prototype.countRunR = function(cardListIndex, indexDictionary, count) {
    if (cardListIndex >= 0) {
        //add new card to indexDictionary
        indexDictionary[this.cardList[cardListIndex].number]++;

        if (!this.runPairs(indexDictionary) && this.continuousRun(indexDictionary)) {
            //no pairs and cards make up whole group
            //current set of cards is longest run found so far
            return this.countRunR(cardListIndex - 1, indexDictionary, this.cardList.length - cardListIndex);
        }
        return this.countRunR(cardListIndex - 1, indexDictionary, count);
    }
    return count;
};

GameLogic.prototype.runPairs = function(indexDictionary) {
    for (var index in indexDictionary) {
        if (indexDictionary.hasOwnProperty(index)) {
            if (indexDictionary[index] > 1) {
                return true;
            }
        }
    }
    return false;
};

GameLogic.prototype.continuousRun = function(indexDictionary) {
    //for checking ordering
    var numbers = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
    var runStarted = false;
    var runFinished = false;
    var contiuous = true;
    numbers.forEach(function(number) {
        if (indexDictionary[number] > 0) {
            //card exists with this number
            if (!runStarted) {
                runStarted = true;
            } else {
                if (runFinished) {
                    contiuous = false;
                }
            }
        } else {
            //card doesn't exist with this number
            if (runStarted && !runFinished) {
                runFinished = true;
            }
        }
    });

    return contiuous;
};

GameLogic.prototype.getPegPoints = function() {
    console.log('getting peg points');
    //calculate points for top card in cardList
    var points = 0;

    var numCardsSame = this.countPairsR(this.cardList.length - 2, 1);
    switch (numCardsSame) {
        case 2:
            //pair
            console.log('pair');
            points += 2;
            break;
        case 3:
            //triples
            console.log('triple');
            points += 6;
            break;
        case 4:
            //four of a kind
            console.log('four of a kind');
            points += 12;
            break;
    }

    //15
    if (this.count === 15) {
        console.log('15 for 2');
        points += 2;
    }

    //31
    if (this.count === 31) {
        console.log('31 for 2');
        points += 1; //(go point given separately)
    }

    //runs
    var indexDictionary = {};
    var numbers = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
    numbers.forEach(function(number) {
        indexDictionary[number] = 0;
    });
    var longestRun = this.countRunR(this.cardList.length - 1, indexDictionary, 0);
    console.log('longest run: ' + longestRun);
    if (longestRun > 2) {
        points += longestRun;
    }

    return points;
};

GameLogic.prototype.counting = function() {
    console.log('counting');
    this.lastIndex = this.cribIndex;
    this.section.on('player/doneCounting2', this.boundCountNextPlayer);
    this.countNextPlayer();
};

GameLogic.prototype.countNextPlayer = function() {
    this.getNextPlayer().countHand(this.cutCard);

};

GameLogic.prototype.cribCounting = function() {
    this.section.removeListener('player/doneCounting2', this.boundCountNextPlayer);
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