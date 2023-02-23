MedianFilter = function (size) {

    var that = this;
    that.vales = [];
    that.sorted = [];
    that.size = size || 7;
    that.middelIndex = Math.round(that.size / 2);

};

MedianFilter.prototype = {};

MedianFilter.prototype.input = function (val) {

    var that = this;

    //If it's empty fill it up
    if (that.vales.length === 0) {
        that.fill(val);
        return val;
    }

    //Remove last
    that.vales.shift();
    //Add new value
    that.vales.push(val);

    //Sort
    that.sorted = that.vales.slice(0);
    that.sorted = that.sorted.sort(function (a, b) { return a - b; });
    //return medium value
    return that.sorted[that.middelIndex];

};

MedianFilter.prototype.fill = function (val) {

    var that = this;
    if (that.vales.length === 0) {
        for (var i = 0; i < that.size; i++) {
            that.vales.push(val);
        }
    }

};

// Usage

var toucheFix = new MedianFilter(10); //Number is size of array to get median value from, default 7
var val = toucheFix.input(touches); //Apply a median filter to this to make it more stable