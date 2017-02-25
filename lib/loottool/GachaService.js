var coroutine = require('co');
var MongoDb = require('mongodb');
var MongoClient = MongoDb.MongoClient;
var MongoObjectId = MongoDb.ObjectId;

var CommandService = require('./CommandService');

var GachaService = function () {
    CommandService.call(this);
};

GachaService.prototype = Object.create(CommandService.prototype);

GachaService.prototype.constructor = GachaService;

GachaService.prototype.getPool = function(db) {
	return db.collection("characters").find({});
};

GachaService.prototype.getPoolSize = function*(db) {
	return yield db.collection("characters").count({});
};

GachaService.prototype.getCharactersByUser = function(db, user, limit) {
	var col = db.collection("user_pulls").find({user_id: user.id});
	if(limit !== undefined){
		col = col.limit(limit);
	}
	return col;
};

GachaService.prototype.getCharacterByUser = function*(db, user, character) {
	var col = db.collection("user_pulls").find({user_id: user.id, name: character}).limit(1);
	if(yield col.hasNext()){
		return yield col.next();
	}
	col = db.collection("characters").find({_id: new MongoObjectId(character)}).limit(1);
	if(yield col.hasNext()){
		var characterFromId = yield col.next();
		col = db.collection("user_pulls").find({user_id: user.id, name: characterFromId.name}).limit(1);
		if(yield col.hasNext()){
			return yield col.next();
		}
	}
	return undefined;
};

GachaService.prototype.removeCharacterFromUser = function*(db, character) {
	yield db.collection("user_pulls").findOneAndDelete(character);
};

GachaService.prototype.removeBattle = function*(db, battle) {
	yield db.collection("battles").findOneAndDelete(battle);
};

GachaService.prototype.addCharacter = function*(db, name, stars){
	yield db.collection("characters").insertOne({name: name, stars: stars});
};

GachaService.prototype.getCharacterByName = function*(db, name){
	var col = db.collection("characters").find({name: name}).limit(1);
	if(yield col.hasNext()){
		return yield col.next();
	} else {
		return undefined;
	}
};

GachaService.prototype.getCharacterByIndex = function*(db, index) {
	var col = db.collection("characters").find({}).skip(index).limit(1);
	if(yield col.hasNext()){
		return yield col.next();
	} else {
		return undefined;
	}
};

GachaService.prototype.getBattleByChannel = function*(db, channel){
	var col = db.collection("battles").find({channel_id: channel}).limit(1);
	if(yield col.hasNext()){
		return yield col.next();
	} else {
		return undefined;
	}
};

GachaService.prototype.addBattle = function*(db, channel, user, character) {
	yield db.collection("battles").insertOne({channel_id: channel, user_id: user.id, user_name: user.name, name: character.name, stars: character.stars});
};

GachaService.prototype.printCharacter = function(character) {
	return character.name + this._printStars(character.stars);
};

GachaService.prototype._printStars = function(stars){
	var messageString =  "";
    for(var i = 0; i < stars; ++i){
		messageString += "\u2605";
	}
	return messageString;
};

GachaService.prototype._addCharacter = function* (bot, message, user, character, messageType) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);

    var exist = yield this.getCharacterByName(db, character);
    if(exist){
        bot.replyPrivateDelayed(message, "Already added " + this.printCharacter(exist));
    } else{
		var star = (Math.floor(Math.random() * 1000) % 6) + 1;
		var newCharacter = {name:character, stars: star};
        yield this.addCharacter(db, character, star);
        var messageString =  "Added " + this.printCharacter(newCharacter);
		messageString += "\nby " + user.name;
        bot.replyPublicDelayed(message, messageString);
		if(messageType === this.messageType.INTERACTIVE) {
			bot.replyPrivateDelayed(message, "You added " + this.printCharacter(newCharacter));
			this.forcePostPublic(bot, message, messageString);
		}
		else bot.replyPublicDelayed(message, messageString);
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
		list = this.getPool(db);
		listString += "Available pulls: \n";
	}
    else {
		list = this.getCharactersByUser(db, user);
		listString += "Your pulls: \n";
	}
    while(yield list.hasNext()) {
        var character = yield list.next();
        listString += this.printCharacter(character) + "\n";
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
	var charSize = yield this.getPoolSize(db);
	if(charSize < 1){
		if(messageType !== this.messageType.OUTGOING) bot.replyPrivateDelayed(message, "Nothing to pull");
		db.close();
		return;
	}
    var randomnumber = Math.floor(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) % charSize);
	var pulled = yield this.getCharacterByIndex(db, randomnumber);
	var toReturn;
	if(pulled === undefined){
		toReturn = "Failed to pull. Someone tried to delete a character.";
		bot.replyPrivateDelayed(message, toReturn);
	} else {
		yield db.collection("user_pulls").insertOne({user_id: user.id, name:pulled.name, stars: pulled.stars});
		var toReturn = user.name + " pulled " + pulled.name + this._printStars(pulled.stars);
		if(messageType === this.messageType.SLASH) bot.replyPublicDelayed(message, toReturn);
		else if(messageType === this.messageType.INTERACTIVE) {
			bot.replyPrivateDelayed(message, "You pulled " + pulled.name + this._printStars(pulled.stars));
			this.forcePostPublic(bot, message, toReturn);
		}
		else bot.replyPublic(message, toReturn);
	}
    
    // Close the connection
    db.close();
};

GachaService.prototype._battle = function* (bot, message, character, user, channel, messageType) {
	// Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	
	var haveCharacter = yield this.getCharacterByUser(db, user, character);
	if(haveCharacter === undefined){
		bot.replyPrivateDelayed(message, "You don't have " + character);
		db.close();
		return;
	}
	
	var battle = yield this.getBattleByChannel(db, channel.id);
	var characterString = this.printCharacter(haveCharacter);
	if(battle === undefined){
		yield this.addBattle(db, channel.id, user, haveCharacter);
		if(messageType === this.messageType.INTERACTIVE) {
			bot.replyPrivateDelayed(message, "You send out " + characterString);
			this.forcePostPublic(bot, message, user.name + " sends out " + characterString);
		}
		else bot.replyPublicDelayed(message, user.name + " sends out " + characterString);
	} else {
		if(battle.user_id === user.id){
			bot.replyPrivateDelayed(message, "You already sent out a character.");
			db.close();
			return;
		}
		var oppCharacterString = this.printCharacter(battle);
		var toSend = user.name + " sends out " + characterString + "\n\n" +
			battle.user_name + "\n" +
			oppCharacterString +
			"\nvs\n" + 
			user.name + "\n" +
			characterString + "\n";
			
		if(Math.random() > 0.5) {
			toSend += "\n" + oppCharacterString + " won!\n" +
			characterString +
			" got salty and left " + user.name;
			
			yield this.removeCharacterFromUser(db, haveCharacter);
		} else{
			toSend += "\n" + characterString + " won!\n" +
			oppCharacterString +
			" got salty and left " + battle.user_name;
			
			yield this.removeCharacterFromUser(db, {user_id: battle.user_id, name: battle.name, stars: battle.stars});
		}
		yield this.removeBattle(db, battle);
		if(messageType === this.messageType.INTERACTIVE) {
			bot.replyPrivateDelayed(message, "You send out " + characterString);
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
	var list = this.getCharactersByUser(db, user, 100);
	var attachments = [];
	for(var i = 0; i < 20 && (yield list.hasNext()); ++i){
		attachments.push(new this._battleSelectGroupTemplate());
		var actions = [];
		for(var j = 0; j < 5 && (yield list.hasNext()); ++j){
			actions.push(new this._battleSelectActionTemplate());
			var character = yield list.next();
			attachments[i].text += j + ": " + this.printCharacter(character) + "\n";
			actions[j].value = character._id.toString();
			actions[j].text = "" + j;
			console.dir(character);
		}
		attachments[i].actions = actions;
	}
	var toSend = new this._battleSelectTemplate();
	toSend.attachments = attachments;
	
	db.close();
	bot.replyPrivateDelayed(message, toSend);
};

GachaService.prototype._addSelect = function*(bot, message, emojiList) {
	// Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	var keys = Object.keys(emojiList);
	
	var attachments = [];
	for(var i = 0, keysIndex = 0; i < 20 && keysIndex < keys.length; ++i){
		attachments.push(new this._addSelectGroupTemplate());
		var actions = [];
		for(var j = 0; j < 5 && keysIndex < keys.length; ++j, ++keysIndex){
			var character = ":" + keys[keysIndex] + ":";
			if(yield this.getCharacterByName(db, character)){
				++keysIndex;
				--j;
				continue;
			}
			actions.push(new this._addSelectActionTemplate());
			actions[j].text = actions[j].value = character;
		}
		attachments[i].actions = actions;
	}
	var toSend = new this._addSelectTemplate();
	toSend.attachments = attachments;
	
	db.close();
	if(toSend.attachments.length === 0 || toSend.attachments[0].actions.length === 0){
		bot.replyPrivateDelayed(message, "No custom emoji to send.");
	}
	else bot.replyPrivateDelayed(message, toSend);
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
			this.getUserInfo(bot,message, function(user){
            	coroutine(this._addCharacter.bind(this, bot, message, user, text[1], this.messageType.SLASH))
                	.catch(this._exceptionCo.bind(this, bot, message, "failed to add " + text[1], true));
			}.bind(this), true);
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
		case "add_select":
			this.getEmoji(bot, function(emoji){
				coroutine(this._addSelect.bind(this, bot, message, emoji))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to list emoji...", true));
			}.bind(this));
			break;
			case "add":
			this.getUserInfo(bot,message, function(user){
            	coroutine(this._addCharacter.bind(this, bot, message, user, message.actions[0].value, this.messageType.INTERACTIVE))
                	.catch(this._exceptionCo.bind(this, bot, message, "failed to add " + message.actions[0].value, true));
			}.bind(this), true);
			break;
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
                .catch(this._exceptionCo.bind(this, bot, message, "failed to send out " + message.actions[0].value, true));
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
				},
				{
					name: "add_select",
					text: "Add to pool",
					type: "button"
				}
			]
		}
	]
};

GachaService.prototype._battleSelectTemplate = function() {
	this.text = "Please select a character to send out:";
};

GachaService.prototype._battleSelectGroupTemplate = function() {
	this.callback_id = "GachaService";
	this.fallback = "Buttons not supported.\nUse\nbattle [character]";
	this.text = "";
};

GachaService.prototype._battleSelectActionTemplate = function() {
	this.name = "battle";
	this.text = "test";
	this.type = "button";
	this.value = "test";
};

GachaService.prototype._addSelectTemplate = function() {
	this.text = "Please select a character to add:";
};

GachaService.prototype._addSelectGroupTemplate = function() {
	this.callback_id = "GachaService";
	this.fallback = "Buttons not supported.\nUse\nadd [character]";
	this.text = "";
};

GachaService.prototype._addSelectActionTemplate = function() {
	this.name = "add";
	this.text = "test";
	this.type = "button";
	this.value = "test";
};

module.exports = GachaService;
