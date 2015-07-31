var teams = require('./teams');
var Deck = require('./deck');
var deck = new Deck();

// module.exports = (function() {

var startGame = function() {

};

// var passToCrib = function() {
//     teams.forEachPlayer(function(clientId) {
//         subpub.emit('toClient', clientId, {
//             event: 'newHand',
//             data: deck.dealHand()
//         });
//     });
// };

subpub.on('teams/startGame', startGame);
// subpub.on('countingDone', passToCrib);


//     return {};
// })();