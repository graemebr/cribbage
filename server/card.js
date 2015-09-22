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

module.exports = Card;