function login() {
    var handleLoginSubmit = function(msg) {
        if (!msg) {
            return false;
        }

        subpub.emit('toServer', {
            event: 'login',
            data: msg
        });

        $('#chooseNamePanel input')[0].value = '';

        //hide login/name choosing screen
        $('#chooseNamePanel').hide();
    };

    $('#chooseNamePanel input').keydown(function(event) {
        if (event.keyCode === 13) { //enter key
            handleLoginSubmit(this.value);
            event.preventDefault();
        }
    });

    $('#chooseNamePanel button').click(function(event) {
        handleLoginSubmit($('#chooseNamePanel input')[0].value);
        event.preventDefault();
    });

    var loginScreen = subpub.on('loginScreen', function() {
        //hide connecting screen
        $('#connecting').hide();
        //show login screen
        $('#chooseNamePanel').show();
        $('#chooseNamePanel input')[0].focus();
    });

    var errorScreen = subpub.on('errorScreen', function() {
        $('#connecting').show();
        $('#connecting').text("error connecting to server");
    });
}

subpub.on('onload', login);