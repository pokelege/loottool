var CommandService = function () {
    Object.call(this);
};

CommandService.prototype = Object.create(Object.prototype);

CommandService.prototype.constructor = CommandService;

CommandService.prototype.resolveSlash = function (bot, message) {
    return false;
};

CommandService.prototype.resolveOutHook = function (bot, message) {
    return false;
};

CommandService.prototype.resolveInteractive = function (bot, message) {
    return false;
};

CommandService.prototype.getUserId = function(message) {
	if(message.user && message.user.id){
		return message.user.id;
	}
	else{
		return message.user_id;
	}
};

CommandService.prototype.getUserName = function(message) {
	if(message.user && message.user.name){
		return message.user.name;
	}
	else{
		return message.user_name;
	}
};

module.exports = CommandService;
