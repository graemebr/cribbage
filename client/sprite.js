function Sprite(img, context) {
    this.img = img;

    this.context = context;
    this.x = 0;
    this.y = 0;
    this.w = this.img.width;
    this.h = this.img.height;
    console.log('w ' + this.w);
    console.log('h' + this.h);
    this.scale = 1;
    this.rotation = 0;
    this.subscriptionIDs = [];
    this.subscriptionIDs.push(subpub.on('canvasClick', (function(position) {
        if (this.contains(position)) {
            this.onClick();
        }
    }).bind(this)));
    this.subscriptionIDs.push(subpub.on('canvasUpdate', (function(time) {
        this.update(time);
    }).bind(this)));
    this.subscriptionIDs.push(subpub.on('canvasDraw', (function() {
        this.draw();
    }).bind(this)));
}

Sprite.prototype.onClick = function() {
    //dummy
};

Sprite.prototype.contains = function(position) {
    return position.x >= this.x &&
        position.x <= this.x + this.w * this.scale &&
        position.y >= this.y &&
        position.y <= this.y + this.h * this.scale;
};

Sprite.prototype.update = function() {
    //dummy
};

Sprite.prototype.draw = function() {
    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.rotate(this.rotation * Math.PI / 180);
    this.context.scale(this.scale, this.scale);
    this.context.drawImage(this.img, 0, 0, this.w, this.h);
    this.context.restore();
};

Sprite.prototype.unsubscribe = function() {
    this.subscriptionIDs.forEach(function(id) {
        subpub.off(id);
    });
};