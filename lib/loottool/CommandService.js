var CommandService = function () {

};

CommandService.prototype = Object.create(Object.prototype);

CommandService.prototype.constructor = CommandService;

CommandService.prototype.resolveSlash = function (bot, message) {
    return false;
};

CommandService.prototype.resolveOutHook = function (bot, message) {
    return false;
};

module.exports = CommandService;
