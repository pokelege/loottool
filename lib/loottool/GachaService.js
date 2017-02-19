var coroutine = require('co');
var MongoClient = require('mongodb').MongoClient;
var CommandService = require('./CommandService');

var GachaService = function () {
    CommandService.call(this);
};

GachaService.prototype = Object.create(CommandService.prototype);

GachaService.prototype.constructor = GachaService;

GachaService.prototype._printStars = function(stars){
	var messageString =  "";
    for(var i = 0; i < stars; ++i){
		messageString += "\u2605";
	}
	return messageString;
};

GachaService.prototype._addCharacter = function* (bot, message, character) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);

    var exist = yield db.collection("characters").find({name: character}).limit(1).toArray();
    if(exist.length < 1){
        var star = (Math.floor(Math.random() * 1000) % 6) + 1;
        yield db.collection("characters").insertOne({name:character, stars: star});
        try{
            var messageString =  "Added " + character;
			messageString += this._printStars(star);
			messageString += "\nby " + message.user_name;
            bot.replyPublicDelayed(message, messageString);
        }
        catch (e){
            console.dir(e);
        }
    } else{
        try{
            bot.replyPrivateDelayed(message, "Already added " + character);
        }
        catch (e){
            console.dir(e);
        }
    }
    // Close the connection
    db.close();
};

GachaService.prototype._listCharacters = function*(bot, message, user) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	var list;
	var listString = "";
	if ((message.actions && message.actions[0].value === "pool") ||
	message.text.includes("pool")) {
		list = db.collection("characters").find({});
		listString += "Available pulls: \n";
	}
    else {
		list = db.collection("user_pulls").find({user_id: user.id});
		listString += "Your pulls: \n";
	}
    while(yield list.hasNext()) {
        var character = yield list.next();
        listString += character.name + this._printStars(character.stars) + "\n";
    }
    // Close the connection
    db.close();

    bot.replyPrivateDelayed(message, listString);
};

GachaService.prototype._pullCharacter = function*(bot, message, user, messageType) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);

    var list = yield db.collection("characters").find({}).toArray();
	if(list.length < 1){
		if(messageType !== this.messageType.OUTGOING) bot.replyPrivateDelayed(message, "Nothing to pull");
		db.close();
		return;
	}
    var randomnumber = Math.floor(Math.floor(Math.random() * 1000) % list.length);
	var pulled = list[randomnumber];
	yield db.collection("user_pulls").insertOne({user_id: user.id, name:pulled.name, stars: pulled.stars});
	
    var toReturn = user.name + " pulled " + pulled.name + this._printStars(pulled.stars);
    // Close the connection
    db.close();
	
    if(messageType === this.messageType.SLASH) bot.replyPublicDelayed(message, toReturn);
	else if(messageType === this.messageType.INTERACTIVE) {
		bot.replyPrivateDelayed(message, "You pulled " + pulled.name + this._printStars(pulled.stars));
		this.forcePostPublic(bot, message, toReturn);
	}
	else bot.replyPublic(message, toReturn);
};

GachaService.prototype._battle = function* (bot, message, character, user, channel, messageType) {
	// Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	
	var haveCharacters = yield db.collection("user_pulls").find({user_id: user.id, name: character}).limit(1).toArray();
	if(haveCharacters.length < 1){
		bot.replyPrivateDelayed(message, "You don't have " + character);
		db.close();
		return;
	}
	var haveCharacter = haveCharacters[0];
	var battles = yield db.collection("battles").find({channel_id: channel.id}).limit(1).toArray();
	if(battles.length < 1){
		yield db.collection("battles").insertOne({channel_id: channel.id, user_id: user.id, user_name: user.name, name: haveCharacter.name, stars: haveCharacter.stars});
		if(messageType === this.messageType.INTERACTIVE) {
			bot.replyPrivateDelayed(message, "You send out " + haveCharacter.name + this._printStars(haveCharacter.stars));
			this.forcePostPublic(bot, message, user.name + " sends out " + haveCharacter.name + this._printStars(haveCharacter.stars));
		}
		else bot.replyPublicDelayed(message, user.name + " sends out " + haveCharacter.name + this._printStars(haveCharacter.stars));
	} else {
		var battle = battles[0];
		if(battle.user_id === user.id){
			bot.replyPrivateDelayed(message, "You already sent out a character.");
			db.close();
			return;
		}
		
		var toSend = user.name + " sends out " + haveCharacter.name + this._printStars(haveCharacter.stars) + "\n\n" +
			battle.user_name + "\n" +
		battle.name + this._printStars(battle.stars) +
			"\nvs\n" + 
			user.name + "\n" +
			haveCharacter.name + this._printStars(haveCharacter.stars) + "\n";
			
		if(Math.random() > 0.5) {
			toSend += "\n" + battle.name + this._printStars(battle.stars) + " won!\n" +
			haveCharacter.name + this._printStars(haveCharacter.stars) +
			" got salty and left " + user.name;
			
			yield db.collection("user_pulls").findOneAndDelete(haveCharacter);
		} else{
			toSend += "\n" + haveCharacter.name + this._printStars(haveCharacter.stars) + " won!\n" +
			battle.name + this._printStars(battle.stars) +
			" got salty and left " + battle.user_name;
			
			yield db.collection("user_pulls").findOneAndDelete({user_id: battle.user_id, name: battle.name, stars: battle.stars});
		}
		yield db.collection("battles").findOneAndDelete(battle);
		if(messageType === this.messageType.INTERACTIVE) {
			bot.replyPrivateDelayed(message, "You send out " + haveCharacter.name + this._printStars(haveCharacter.stars));
			this.forcePostPublic(bot, message, toSend);
		}
		else bot.replyPublicDelayed(message, toSend);
	}
	
	db.close();
};

GachaService.prototype._battleSelect = function*(bot, message, user) {
	// Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	var list = db.collection("user_pulls").find({user_id: user.id}).limit(100);
	var attachments = [];
	for(var i = 0; i < 20 && (yield list.hasNext()); ++i){
		attachments.push(new this._battleSelectGroupTemplate());
		var actions = [];
		for(var j = 0; j < 5 && (yield list.hasNext()); ++j){
			actions.push(new this._battleSelectActionTemplate());
			var character = yield list.next();
			actions[j].text = actions[j].value = character.name + this._printStars(character.stars);
		}
		attachments[i].actions = actions;
	}
	var toSend = new this._battleSelectTemplate();
	toSend.attachments = attachments;
	
	db.close();
	bot.replyPrivateDelayed(message, toSend);
};

GachaService.prototype._exceptionCo = function(bot, message, errorMessage, isSlash, err){
    console.log(err.stack);
    if(isSlash) bot.replyPrivateDelayed(message, errorMessage);
};

GachaService.prototype.resolveSlash = function (bot, message) {
    if (message.token !== process.env.GACHA_TOKEN
	&& message.command !== process.env.GACHA_COMMAND) return false;
	bot.replyAcknowledge();
    var text = message.text.trim().split(" ");
    switch(text[0]){
        case "add":
            coroutine(this._addCharacter.bind(this, bot, message, text[1]))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to add " + text[1], true));
            break;
        case "list":
			this.getUserInfo(bot,message, function(user){
				coroutine(this._listCharacters.bind(this, bot, message, user))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to list characters", true));
			}.bind(this));
            break;
        case "pull":
			this.getUserInfo(bot,message, function(user){
            coroutine(this._pullCharacter.bind(this, bot, message, user, this.messageType.SLASH))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to pull... wtf", true));
			}.bind(this), true);
            break;
			case "battle":
				this.getUserInfo(bot,message, function(user){
						this.getChannelInfo(bot,message, function(channel){
							coroutine(this._battle.bind(this, bot, message, text[1], user, channel, this.messageType.SLASH))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to send out " + text[1], true));
					}.bind(this));
				}.bind(this), true);
				break;
        default:
            bot.replyPrivateDelayed(message, this._startInteractive);
    }
    return true;
};

GachaService.prototype.resolveOutHook = function (bot, message) {
    if (message.token !== process.env.GACHA_PULL_TOKEN) return false;
	this.getUserInfo(bot,message, function(user){
    coroutine(this._pullCharacter.bind(this, bot, message, user, this.messageType.OUTGOING))
	.catch(this._exceptionCo.bind(this, bot, message, "failed to pull... wtf"));
	}.bind(this), true);
    return true;
};

GachaService.prototype.resolveInteractive = function (bot, message) {
	if(message.callback_id !== "GachaService") return false;
	bot.replyAcknowledge();
	switch (message.actions[0].name){
		case "pull":
			this.getUserInfo(bot,message, function(user){
			coroutine(this._pullCharacter.bind(this, bot, message, user, this.messageType.INTERACTIVE))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to pull... wtf", true));
				}.bind(this), true);
			break;
			case "list":
				this.getUserInfo(bot,message, function(user){
				coroutine(this._listCharacters.bind(this, bot, message, user))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to list characters", true));
			}.bind(this));
				break;
			case "char_select":
				this.getUserInfo(bot,message, function(user){
				coroutine(this._battleSelect.bind(this, bot, message, user))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to list characters", true));
				}.bind(this));
				break;
			case "battle":
				this.getUserInfo(bot,message, function(user){
						this.getChannelInfo(bot,message, function(channel){
							coroutine(this._battle.bind(this, bot, message, message.actions[0].value, user, channel, this.messageType.INTERACTIVE))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to send out " + text[1], true));
					}.bind(this));
				}.bind(this), true);
				break;
			default:
			bot.replyPrivateDelayed(message, "lol wat");
	}
	return true;
};

GachaService.prototype._startInteractive = {
	text: "Welcome to the World of Gacha!",
	attachments: [
		{
			callback_id: "GachaService",
			title: "What would you like to do?",
			fallback: "Buttons not supported.\nCommands:\nadd [character]\nlist [mine, pool]\npull\nbattle [character]",
			actions: [
				{
					name: "pull",
					text: "Pull",
					style: "primary",
					type: "button"
				},
				{
					name: "char_select",
					text: "Battle",
					type: "button"
				},
				{
					name: "list",
					value: "mine",
					text: "List my pulls",
					type: "button"
				},
				{
					name: "list",
					value: "pool",
					text: "List available characters",
					type: "button"
				}
			]
		}
	]
};

GachaService.prototype._battleSelectTemplate = function() {
	this.text = "Please select a character:";
};

GachaService.prototype._battleSelectGroupTemplate = function() {
	this.callback_id = "GachaService";
	this.fallback = "Buttons not supported.\nUse\nbattle [character]";
};

GachaService.prototype._battleSelectActionTemplate = function() {
	this.name = "battle";
	this.text = "test";
	this.type = "button";
	this.value = "test";
};

module.exports = GachaService;
