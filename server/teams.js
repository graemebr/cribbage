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


    subpub.on('client/setTeam', function(clientId, team) {
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
            subpub.emit('validTeams');
        }
    });

    subpub.on('playerJoin', function(data) {
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
            subpub.emit('validTeams');
        }
    });

    subpub.on('playerLeave', function(data) {
        remove(data.id);
        numPlayers--;

        if (validateTeams()) {
            subpub.emit('validTeams');
        }
    });

    subpub.on('newClient', function(clientId) {
        subpub.emit('toClient', clientId, {
            event: 'currentTeams',
            data: {
                red: red,
                blue: blue,
                green: green
            }
        });
    });

    return {
        validate: validateTeams
    };
})();