var CommandService_ = function () {
    var CommandService = {};
    CommandService.prototype = Object.create(Object.prototype);

    CommandService.prototype.constructor = CommandService;

    CommandService.prototype.resolveSlash = function (bot, message) {
        return false;
    };

    CommandService.prototype.resolveOutHook = function (bot, message) {
        return false;
    };
    return CommandService;
};

module.exports = CommandService_;
