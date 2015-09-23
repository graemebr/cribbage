var globals = {
    clientId: null,
    clientName: null
};

//starts all client modules
window.onload = function() {
    subpub.emit("onload");
};

subpub.on('server/clientId', function(clientId) {
    globals.clientId = clientId;
});

subpub.on('server/clientName', function(clientName) {
    globals.clientName = clientName;
});