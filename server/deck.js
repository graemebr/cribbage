

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
    var handCards = [];
    for (var i = 0; i < numCards; i++) {
        handCards.push(this.cards.pop());
    }
    return (new Hand(handCards));
};

Deck.prototype.addCards = function(newCards) {
    Array.prototype.push.apply(this.cards, newCards);
};

var Card = function(data) {
    //creates card objects

    this.suit = data.suit;
    this.number = data.number;
    this.value = data.value;
    this.id = data.id;
};

Card.prototype.same = function(card) {
    return this.sameSuit(card) && this.sameNumber(card);
};

Card.prototype.sameSuit = function(card) {
    return this.suit === card.suit;
};

Card.prototype.sameNumber = function(card) {
    return this.number === card.number;
};

var Hand = function(cards) {
    //creates hand objects
    this.cards = cards;
};

module.exports = Deck;