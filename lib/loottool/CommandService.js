var CommandService = function () {
    Object.call(this);
};

CommandService.prototype = Object.create(Object.prototype);

CommandService.prototype.constructor = CommandService;

CommandService.prototype.resolveSlash = function (bot, message) {
    return false;
};

CommandService.prototype.messageType = {
	SLASH: 0,
	OUTGOING: 1,
	INTERACTIVE: 2
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
		if(typeof message.user === "object" && message.user.name){
			info.name = message.user.name;
		} else if (message.user_name){
			info.name = message.user_name;
		} else {
			bot.api.users.info({token:bot.config.token, user: info.id},
			function(err,response){
				if(response.user) info = response.user;
				cb(info);
			});
			return;
		}
	}
	cb(info);
};

CommandService.prototype.getChannelInfo = function(bot, message, cb, all) {
	var info = {};
	if(typeof message.channel === "object" && message.channel.id){
		info.id = message.channel.id;
	} else if(message.channel){
		info.id = message.channel;
	}
	else{
		info.id = message.channel_id;
	}
	
	if(info.id && all) {
		if(typeof message.channel === "object" && message.channel.name){
			info.name = message.channel.name;
		} else if (message.channel_name){
			info.name = message.channel_name;
		} else {
			bot.api.channels.info({token:bot.config.token, channel: info.id},
			function(err,response){
				if(response.channel) info = response.channel;
				cb(info);
			});
			return;
		}
	}
	cb(info);
};

CommandService.prototype.forcePostPublic = function(bot, message, text){
	var toSend = {};
	toSend.token = bot.config.token;
	if(typeof message.channel === "object" && message.channel.id)
		toSend.channel = message.channel.id;
	else if(message.channel)
		toSend.channel = message.channel;
	else
		toSend.channel = message.channel_id;
	toSend.text = text;
	console.dir(toSend);
	console.dir(message);
	bot.api.chat.postMessage(toSend,
	function(err,response){
		console.log(err);
		console.dir(response);
	}
	);
};

module.exports = CommandService;
