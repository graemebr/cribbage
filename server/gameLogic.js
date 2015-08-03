var Deck = require('./deck');
var Player = require('./player');

module.exports = function(section) {

    var deck = new Deck();


    var startGame = function() {

    };
    section.on('teams/startGame', startGame);
};