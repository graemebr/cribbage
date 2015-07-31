function lobby() {
    subpub.on('server/lobbyScreen', function(gameList) {

        for (var i = 0; i < gameList.length; i++) {
            createGameLI(gameList[i]);
        }

        $('#lobbyPanel').show();
    });

    function createGameLI(game) {
        var gameLI = document.createElement('li');
        gameLI.appendChild(document.createTextNode(game.name));
        gameLI.style.display = 'none';
        gameLI.setAttribute('class', 'gameLI');
        gameLI.setAttribute('id', game.gameId);

        $('#lobbyPanel ul').append(gameLI);

        $('#' + game.gameId).click(function() {
            subpub.emit('toServer', {
                event: 'joinGame',
                data: game.gameId
            });

            $('#lobbyPanel').hide();
         });

        $('#' + game.gameId).fadeIn('slow');
    }

    subpub.on('server/newGameCreated', createGameLI);

    function handleNewGameSubmit(text) {
        if (!text) {
            return false;
        }

        subpub.emit('toServer', {
            event: 'createGame',
            data: text
        });

        $('#lobbyPanel input')[0].value = '';
    }

    $('#lobbyPanel input').keydown(function(event) {
        if (event.keyCode === 13) { //enter key
            handleNewGameSubmit(this.value);
            event.preventDefault();
        }
    });

    $('#lobbyPanel button').click(function(event) {
        handleNewGameSubmit($('#lobbyPanel input')[0].value);
        event.preventDefault();
    });
}
subpub.on('onload', lobby);