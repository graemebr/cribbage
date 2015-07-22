var subpub = require('./subpub');

module.exports = (function() {
    var red = [],
        blue = [],
        green = [];
    var numPlayers = 0;

    var addToSmallest = function(id) {
        if (red.length <= blue.length) {
            if (red.length <= green.length) {
                //red
                red.push(id);
                return 'red';
            } else {
                //green
                green.push(id);
                return 'green';
            }
        } else {
            if (blue.length <= green.length) {
                //blue
                blue.push(id);
                return 'blue';
            } else {
                //green
                green.push(id);
                return 'green';
            }
        }
    };

    var addToSizeOne = function(id) {
        if (red.length === 1) {
            //red
            red.push(id);
            return 'red';
        } else if (blue.length === 1) {
            //blue
            blue.push(id);
            return 'blue';
        } else if (green.length === 1) {
            //green
            green.push(id);
            return 'green';
        } else {
            return addToSmallest(id);
        }
    };

    var remove = function(id) {
        if (!removeFromArray(red, id)) {
            if (!removeFromArray(blue, id)) {
                removeFromArray(green, id);
            }
        }
    };

    var removeFromArray = function(arr, id) {
        var index = arr.indexOf(id);
        if (index === -1) {
            return false;
        }
        arr.splice(index, 1);
        return true;
    };

    var validateTeams = function() {
        switch (numPlayers) {
            case 2:
            case 3:
                return (red.length < 2 &&
                    blue.length < 2 &&
                    green.length < 2);
            case 4:
                return ((red.length === 2 || red.length === 0) &&
                    (blue.length === 2 || blue.length === 0) &&
                    (green.length === 2 || green.length === 0));
            case 6:
                return (red.length === 2 &&
                    blue.length === 2 &&
                    green.length === 2);
        }
        return false;
    };

    var cementTeams = function() {
        //remove all callbacks for changing teams
        subpub.removeListener('client/setTeam', setTeamCallback);
        subpub.removeListener('playerJoin', playerJoinCallback);
        subpub.removeListener('playerLeave', playerLeaveCallback);
        subpub.removeListener('newClient', newClientCallback);
        subpub.removeListener('client/startGame', startGameCallback);

        //TODO: new callback for playerLeave events
    };

    var setTeamCallback = function(clientId, team) {
        console.log('team: ' + team);
        remove(clientId);
        switch (team) {
            case 'red':
                red.push(clientId);
                break;
            case 'blue':
                blue.push(clientId);
                break;
            case 'green':
                green.push(clientId);
                break;
        }

        subpub.emit('toAllClients', {
            event: 'updateTeam',
            data: {
                id: clientId,
                team: team
            }
        });

        if (validateTeams()) {
            subpub.emit('toAllClients', {
                event: 'validTeams'
            });
        } else {
            subpub.emit('toAllClients', {
                event: 'invalidTeams'
            });
        }
    };

    subpub.on('client/setTeam', setTeamCallback);

    var playerJoinCallback = function(data) {
        var team;

        if (numPlayers === 3) {
            team = addToSizeOne(data.id);
        } else {
            team = addToSmallest(data.id);
        }
        numPlayers++;

        subpub.emit('toAllClients', {
            event: 'updateTeam',
            data: {
                id: data.id,
                team: team
            }
        });

        if (validateTeams()) {
            subpub.emit('toAllClients', {
                event: 'validTeams'
            });
        } else {
            subpub.emit('toAllClients', {
                event: 'invalidTeams'
            });
        }
    };

    subpub.on('playerJoin', playerJoinCallback);


    var playerLeaveCallback = function(data) {
        remove(data.id);
        numPlayers--;

        if (validateTeams()) {
            subpub.emit('toAllClients', {
                event: 'validTeams'
            });
        } else {
            subpub.emit('toAllClients', {
                event: 'invalidTeams'
            });
        }
    };

    subpub.on('playerLeave', playerLeaveCallback);

    var newClientCallback = function(clientId) {
        subpub.emit('toClient', clientId, {
            event: 'currentTeams',
            data: {
                red: red,
                blue: blue,
                green: green
            }
        });
    };

    subpub.on('newClient', newClientCallback);

    var startGameCallback = function() {
        console.log('start game');
        if (validateTeams()) {
            console.log('valid teams');
            //can start game
            //cement teams to disallow changes
            cementTeams();
            //tell clients game has started and final teams
            subpub.emit('toAllClients', {
                event: 'startGame',
                data: {
                    red: red,
                    blue: blue,
                    green: green
                }
            });
        }
    };

    subpub.on('client/startGame', startGameCallback);

    return {};
})();