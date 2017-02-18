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

CommandService.prototype.getUserInfo = function(bot, message, cb, all) {
	var info = {};
	if(typeof message.user === "object" && message.user.id){
		info.id = message.user.id;
	} else if(message.user){
		info.id = message.user;
	}
	else{
		info.id = message.user_id;
	}
	
	if(info.id && all) {
		if(message.user === "object" && message.user.name){
			info.name = message.user.name;
		} else if (message.user_name){
			info.name = message.user_name;
		} else {
			bot.api.users.info({token:message.token, user: info.id},
			function(err,response){
				console.log(err);
				console.dir(response);
				info = response;
				cb(info);
			});
			return;
		}
	}
	cb(info);
};

module.exports = CommandService;
