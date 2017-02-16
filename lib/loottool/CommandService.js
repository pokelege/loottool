var CommandService = function () {

};

CommandService.prototype = Object.create(Object.prototype);

CommandService.prototype.constructor = CommandService;

CommandService.prototype.resolveSlash = function (bot, message) {
    bot.replyPrivate(message, "I don't understand: " + message.command);
    return true;
};

CommandService.prototype.resolveOutHook = function (bot, message) {
    bot.replyPrivate(message, "I don't understand: " + message.trigger_word);
    return true;
};

module.exports = CommandService;