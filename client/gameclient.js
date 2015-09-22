var globals = {
    clientId: null,
    clientName: null
};

var cardImages = {};
var backImage;
//starts all client modules
window.onload = function() {
    var canvas = document.getElementById('gameCanvas');
    var context = document.getElementById('gameCanvas').getContext('2d');
    var gamePanel = $('#gamePanel');
    canvas.width = gamePanel.width();
    canvas.height = gamePanel.height();

    canvas.addEventListener('click', function(event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        console.log('click: ' + x + ' ' + y);
        subpub.emit('canvasClick', {
            x: x,
            y: y
        });
    });
    subpub.emit("onload");
};

subpub.on('server/clientId', function(clientId) {
    globals.clientId = clientId;
});

subpub.on('server/clientName', function(clientName) {
    globals.clientName = clientName;
});

subpub.on('server/loadAssets', function(cards) {
    var count = cards.length;
    count++; //back image
    cards.forEach(function(card) {
        var img = new Image();
        img.src = 'playingCards/' + card.number + '_of_' + card.suit + '.png';
        cardImages[card.id] = img;
        img.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
    });
    backImage = new Image();
    backImage.src = 'playingCards/back.png';
    backImage.onload = function() {
        if (--count === 0) {
            console.log('assetsLoaded');
            subpub.emit('toServer', {
                event: 'assetsLoaded',
            });
        }
    };
});

subpub.on('server/passToCrib', function(hand) {
    var spriteHand = [];
    var context = document.getElementById('gameCanvas').getContext('2d');
    var passCount = (hand.length === 5) ? 1 : 2;
    var passCards = [];
    console.log('passToCrib');
    hand.forEach(function(card) {
        var sprite = new Sprite(cardImages[card.id], 0.2, context);
        sprite.onClick = function() {
            if(passCards.length < passCount) {
                passCards.push(card);
                sprite.y -= 20;
                sprite.draw();
                if(passCards.length === passCount) {
                    subpub.emit('toServer', {
                        event: 'donePassToCrib',
                        data: passCards
                    });
                }
               }
        };
        spriteHand.push(sprite);
    });

    var x = 0;
    var y = 50;
    spriteHand.forEach(function(sprite) {
        x += 110;
        sprite.x = x;
        sprite.y = y;
        sprite.draw();
    });
});

subpub.on('server/cribCards', function(numCards) {
    var spriteCrib = [];
    var context = document.getElementById('gameCanvas').getContext('2d');
    console.log('addToCrib');
    var x = 0;
    var y = 200;
    for (var i = 0; i < numCards; i++) {
        var sprite = new Sprite(backImage, 0.2, context);
        spriteCrib.push(sprite);
        x += 110;
        sprite.x = x;
        sprite.y = y;
        sprite.draw();
    }
});

subpub.on('server/cutCard', function(card) {
    var canvas = document.getElementById('gameCanvas');
    var context = canvas.getContext('2d');
    var sprite = new Sprite(cardImages[card.id], 0.2, context);
    sprite.y = 50;
    sprite.x = canvas.width - 110;
    sprite.draw();
});

subpub.on('server/cutDeck', function(numCards) {
    //TODO make actual cut deck picker
    console.log('choosing cutCard');
    subpub.emit('toServer', {
        event: 'doneCutDeck',
        data: Math.floor(Math.random() * numCards)
    });
});