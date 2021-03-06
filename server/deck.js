var Card = require('./card');

//make a list of all cards possible
var allCards = (function() {
    var suits = ['clubs', 'diamonds', 'spades', 'hearts'];
    var numbers = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
    var cards = [];
    for (var i = 0; i < suits.length; i++) {
        for (var j = 0; j < numbers.length; j++) {
            //get card value
            var val = j + 1;
            if (val > 10) {
                val = 10;
            }
            //create collection entry
            cards.push({
                suit: suits[i],
                number: numbers[j],
                value: val,
                id: suits[i] + numbers[j]
            });
        }
    }
    return cards;
})();



var Deck = function() {
    //creates card deck objects (default is non-sorted!)

    //list of all cards in deck
    this.cards = [];
    //initialise to full deck
    for (var i = 0; i < allCards.length; i++) {
        this.cards.push(new Card(allCards[i]));
    }
};

Deck.prototype.shuffle = function() {
    //randomize cards
    var spectrum = [];

    //assign each card a random position in spectrum
    for (var i = 0; i < this.cards.length; i++) {
        spectrum.push({
            position: Math.random(),
            card: this.cards[i]
        });
    }

    //sort cards by position in spectrum
    spectrum.sort(function(a, b) {
        return a.position - b.position;
    });

    //replace cards list with new random list
    this.cards = [];
    for (var k = 0; k < spectrum.length; k++) {
        this.cards.push(spectrum[k].card);
    }
};

Deck.prototype.dealHand = function(numCards) {
    return this.cards.splice(0,numCards);
};

Deck.prototype.getNumCards = function() {
    return this.cards.length;
};

Deck.prototype.cutDeck = function(index) {
    return this.cards.splice(index, 1)[0];
};

module.exports = Deck;