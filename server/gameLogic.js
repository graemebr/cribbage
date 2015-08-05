var Deck = require('./deck');

module.exports = function(section) {

    var deck = new Deck();


    var startGame = function() {

    };
    section.on('teams/startGame', startGame);
};