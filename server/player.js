var Card = require('./card');

function Player(clientId, name, section) {
    this.clientId = clientId;
    this.name = name;
    this.hand = [];
    this.unpeggedCards = [];
    this.crib = null;
    this.section = section;
    this.team = null;
    this.go = false;
    this.donePegging = false;
    this.section.on('client/donePassToCrib', this.onDonePassToCrib.bind(this));
}

Player.prototype.passToCrib = function(hand, cribPlayer, cribCards, discardCribCard) {
    this.hand = hand;
    this.unpeggedCards = hand;
    this.donePegging = false;
    this.go = false;
    this.crib = null;
    this.section.emit(this.clientId, {
        event: 'passToCrib',
        data: {
            hand: this.hand,
            cribPlayer: cribPlayer.name,
            discardCribCard: discardCribCard
        }
    });
    if (this === cribPlayer) {
        this.crib = [];
        if (cribCards.length === 1) {
            this.crib.push(cribCards[0]);
        }
    }
};

Player.prototype.onDonePassToCrib = function(clientId, data) {
    if (this.clientId === clientId) {
        //cards that are being passed
        data.passedCards.forEach((function(passedCard) {
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
    if (this.crib !== null && !data.discardCribCard) {
        data.passedCards.forEach((function(passedCard) {
            this.crib.push(new Card(passedCard)); //using new Card to regain prototype of passedCards. Not sure if needed really
        }).bind(this));
        if (this.crib.length === this.hand.length) {
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
};

Player.prototype.newPeggingRound = function() {
    this.go = false;
    this.section.emit(this.clientId, {
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

    console.log('peg ' + this.name);
    if (allowedCards.length > 0) {
        console.log('allowedCards > 0 ' + this.name);
        function pegDone(clientId, card) {
            console.log('chosen card server');
            console.log(card);
            this.unpeggedCards = this.unpeggedCards.filter(function(obj) {
                return !(obj.same(card));
            });
            this.section.emit('allClients', {
                event: 'cardPegged',
                data: {
                    card: card,
                    cardCount: card.value + cardCount
                }
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
    var pointsAccumulated = 0;
    this.section.emit('allClients', {
        event: 'pointsAccumulated',
        data: pointsAccumulated
    });

    function clearCardCount() {
        pointsAccumulated = 0;
        this.section.emit('allClients', {
            event: 'pointsAccumulated',
            data: pointsAccumulated
        });
    }
    var boundClearCardCount = clearCardCount.bind(this);

    function run(cards) {
        //check if run
        //for checking ordering
        var numbers = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

        //create indexDictionary of cards
        var indexDictionary = {};
        cards.forEach(function(card) {
            indexDictionary[card.number] = 1;
        });

        var runStarted = false;
        var isRun = false;
        var count = 0;
        numbers.some(function(number) {
            if (indexDictionary[number] === 1) {
                //one card exists with this number
                count++;
                if (!runStarted) {
                    runStarted = true;
                }
                if (count === cards.length) {
                    //all cards in set have been passed
                    isRun = true;
                    return true; // break
                }
            } else if (indexDictionary[number > 1]) {
                return true; //break because not a run
            } else {
                //card doesn't exist with this number
                if (runStarted) {
                    return true; // break because we've reached the end of our possible run
                }
            }
            return false;
        });

        return isRun;
    }

    function countCards(clientId, cards) {
        //two cards
        if (cards.length === 2) {
            //pairs, 15, jack's nib
            if (cards[0].number === cards[1].number) {
                pointsAccumulated += 2;
            }
            if ((cards[0].value + cards[1].value) === 15) {
                pointsAccumulated += 2;
            }
            if (cutCard.same(cards[0]) && cards[1].number === 'jack' && cards[0].suit === cards[1].suit) {
                pointsAccumulated += 1;
            }
            if (cutCard.same(cards[1]) && cards[0].number === 'jack' && cards[0].suit === cards[1].suit) {
                pointsAccumulated += 1;
            }
        }

        //three cards
        if (cards.length === 3) {
            //15
            //run
            //triple\
            // //            var triple;
            // if (cards[0].number === cards[1].number && cards[0].number === cards[2].number) {
            //     pointsAccumulated += 6;
            // }
            if ((cards[0].value + cards[1].value + cards[2].value) === 15) {
                pointsAccumulated += 2;
            }
            if (run(cards)) {
                pointsAccumulated += 3;
            }
        }


        //four cards
        if (cards.length === 4) {
            //flush (no cutCard)
            //15
            //run 4
            // //quadruple
            // if (cards[0].number === cards[1].number && cards[0].number === cards[2].number && cards[0].number === cards[3].number) {
            //     pointsAccumulated += 12;
            // }
            if ((cards[0].value + cards[1].value + cards[2].value + cards[3].value) === 15) {
                pointsAccumulated += 2;
            }
            if (run(cards)) {
                pointsAccumulated += 4;
            }
            var includesCutCard = cards.some(function(card) {
                return cutCard.same(card);
            });
            if (!includesCutCard && cards[0].suit === cards[1].suit && cards[0].suit === cards[2].suit && cards[0].suit === cards[3].suit) {
                pointsAccumulated += 4;
            }
        }

        //five cards
        if (cards.length === 5) {
            //flush
            //15
            //run 5
            if ((cards[0].value + cards[1].value + cards[2].value + cards[3].value + cards[4].value) === 15) {
                pointsAccumulated += 2;
            }
            if (run(cards)) {
                pointsAccumulated += 5;
            }
            if (cards[0].suit === cards[1].suit && cards[0].suit === cards[2].suit && cards[0].suit === cards[3].suit && cards[0].suit === cards[4].suit) {
                pointsAccumulated += 5;
            }
        }
        console.log('pointsAccumulated: ' + pointsAccumulated);
        this.section.emit('allClients', {
            event: 'pointsAccumulated',
            data: pointsAccumulated
        });
    }
    var boundCountCards = countCards.bind(this);
    this.section.on('client/countCards', boundCountCards);
    this.section.on('client/clearCardCount', boundClearCardCount);
    this.section.once('client/doneCountingCards', (function(clientId) {
        this.section.removeListener('client/countCards', boundCountCards);
        this.section.removeListener('client/clearCardCount', boundClearCardCount);
        this.cutPoints(pointsAccumulated);
        this.section.emit('player/doneCounting');
        this.section.emit('player/doneCounting2');
    }).bind(this));
    this.section.emit('allClients', {
        event: 'countHand',
        data: {
            hand: this.hand,
            cutCard: cutCard,
            name: this.name,
            clientId: this.clientId
        }
    });
};

Player.prototype.countCrib = function(cutCard) {
    var pointsAccumulated = 0;
    this.section.emit('allClients', {
        event: 'pointsAccumulated',
        data: pointsAccumulated
    });

    function clearCardCount() {
        pointsAccumulated = 0;
        this.section.emit('allClients', {
            event: 'pointsAccumulated',
            data: pointsAccumulated
        });
    }
    var boundClearCardCount = clearCardCount.bind(this);

    function run(cards) {
        //check if run
        //for checking ordering
        var numbers = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

        //create indexDictionary of cards
        var indexDictionary = {};
        cards.forEach(function(card) {
            indexDictionary[card.number] = 1;
        });

        var runStarted = false;
        var isRun = false;
        var count = 0;
        numbers.some(function(number) {
            if (indexDictionary[number] === 1) {
                //one card exists with this number
                count++;
                if (!runStarted) {
                    runStarted = true;
                }
                if (count === cards.length) {
                    //all cards in set have been passed
                    isRun = true;
                    return true; // break
                }
            } else if (indexDictionary[number > 1]) {
                return true; //break because not a run
            } else {
                //card doesn't exist with this number
                if (runStarted) {
                    return true; // break because we've reached the end of our possible run
                }
            }
            return false;
        });

        return isRun;
    }

    function countCards(clientId, cards) {
        //two cards
        if (cards.length === 2) {
            //pairs, 15, jack's nib
            if (cards[0].number === cards[1].number) {
                pointsAccumulated += 2;
            }
            if ((cards[0].value + cards[1].value) === 15) {
                pointsAccumulated += 2;
            }
            if (cutCard.same(cards[0]) && cards[1].number === 'jack' && cards[0].suit === cards[1].suit) {
                pointsAccumulated += 1;
            }
            if (cutCard.same(cards[1]) && cards[0].number === 'jack' && cards[0].suit === cards[1].suit) {
                pointsAccumulated += 1;
            }
        }

        //three cards
        if (cards.length === 3) {
            //15
            //run
            // //triple\
            // //            var triple;
            // if (cards[0].number === cards[1].number && cards[0].number === cards[2].number) {
            //     pointsAccumulated += 6;
            // }
            if ((cards[0].value + cards[1].value + cards[2].value) === 15) {
                pointsAccumulated += 2;
            }
            if (run(cards)) {
                pointsAccumulated += 3;
            }
        }


        //four cards
        if (cards.length === 4) {
            //flush (no cutCard)
            //15
            //run 4
            // //quadruple
            // if (cards[0].number === cards[1].number && cards[0].number === cards[2].number && cards[0].number === cards[3].number) {
            //     pointsAccumulated += 12;
            // }
            if ((cards[0].value + cards[1].value + cards[2].value + cards[3].value) === 15) {
                pointsAccumulated += 2;
            }
            if (run(cards)) {
                pointsAccumulated += 4;
            }
            var includesCutCard = cards.some(function(card) {
                return cutCard.same(card);
            });
            if (!includesCutCard && cards[0].suit === cards[1].suit && cards[0].suit === cards[2].suit && cards[0].suit === cards[3].suit) {
                pointsAccumulated += 4;
            }
        }

        //five cards
        if (cards.length === 5) {
            //flush
            //15
            //run 5
            if ((cards[0].value + cards[1].value + cards[2].value + cards[3].value + cards[4].value) === 15) {
                pointsAccumulated += 2;
            }
            if (run(cards)) {
                pointsAccumulated += 5;
            }
            if (cards[0].suit === cards[1].suit && cards[0].suit === cards[2].suit && cards[0].suit === cards[3].suit && cards[0].suit === cards[4].suit) {
                pointsAccumulated += 5;
            }
        }
        console.log('pointsAccumulated: ' + pointsAccumulated);
        this.section.emit('allClients', {
            event: 'pointsAccumulated',
            data: pointsAccumulated
        });
    }
    var boundCountCards = countCards.bind(this);
    this.section.on('client/countCards', boundCountCards);
    this.section.on('client/clearCardCount', boundClearCardCount);
    this.section.once('client/doneCountingCards', (function(clientId) {
        this.section.removeListener('client/countCards', boundCountCards);
        this.section.removeListener('client/clearCardCount', boundClearCardCount);
        this.cutPoints(pointsAccumulated);
        this.section.emit('player/doneCribCounting');
    }).bind(this));
    this.section.emit('allClients', {
        event: 'countCrib',
        data: {
            hand: this.crib,
            cutCard: cutCard,
            name: this.name,
            clientId: this.clientId
        }
    });
};

module.exports = Player;