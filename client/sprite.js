function Sprite(img, scale, context) {
    this.img = img;

    this.context = context;
    this.x = 0;
    this.y = 0;
    this.w = this.img.width * scale;
    this.h = this.img.height * scale;
    subpub.on('canvasClick', (function(position) {
        if (this.contains(position)) {
            this.onClick();
        }
    }).bind(this));
}

Sprite.prototype.onClick = function() {
    //dummy
};

Sprite.prototype.contains = function(position) {
    return position.x >= this.x &&
        position.x <= this.x + this.w &&
        position.y >= this.y &&
        position.y <= this.y + this.h;
};

Sprite.prototype.draw = function() {
    this.context.drawImage(this.img, this.x, this.y, this.w, this.h);
};