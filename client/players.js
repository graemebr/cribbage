//sets up the window with player names and team setting abilities
function players() {
    //setup DOM stuff
    var playerJoin = subpub.on('server/playerJoin', function(player) {
        var playerName = document.createElement('li');
        playerName.appendChild(document.createTextNode(player.name));
        playerName.style.display = 'none';
        playerName.setAttribute('id', player.id);
        console.log(player.id);
        $('#playersPanel ul').append(playerName);
        $('#' + player.id).fadeIn('slow');
        subpub.emit('chatAlert', {
            msg: player.name + ' connected',
            cssClass: 'notice'
        });

        //TODO:
        //adjust the team options for each li
    });

    var playerLeave = subpub.on('server/playerLeave', function(player) {
        $('#' + player.id).fadeOut('slow');
        subpub.emit('chatAlert', {
            msg: player.name + ' disconnected',
            cssClass: 'error'
        });

        //TODO:
        //adjust the team options for each li
    });
}


subpub.on('onload', players);