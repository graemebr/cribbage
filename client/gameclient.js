var globals = {
    clientId: null
};

//starts all client modules
window.onload = function() {
    subpub.emit("onload");
};

subpub.on('server/clientId', function(data) {
    globals.clientId = data;
});