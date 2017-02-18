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

GachaService.prototype._listCharacters = function*(bot, message) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	var list;
	var listString = "";
	if (message.text.includes("pool")) {
		list = db.collection("characters").find({});
		listString += "Available pulls: \n";
	}
    else {
		list = db.collection("user_pulls").find({user_id: message.user_id});
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

GachaService.prototype._pullCharacter = function*(bot, message, isSlash) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);

    var list = yield db.collection("characters").find({}).toArray();
	if(list.length < 1){
		if(isSlash) bot.replyPrivateDelayed(message, "Nothing to pull");
		db.close();
		return;
	}
    var randomnumber = Math.floor(Math.floor(Math.random() * 1000) % list.length);
	var pulled = list[randomnumber];
	yield db.collection("user_pulls").insertOne({user_id: message.user_id, name:pulled.name, stars: pulled.stars});
	
    var toReturn = message.user_name + " pulled " + pulled.name + this._printStars(pulled.stars);
    // Close the connection
    db.close();

    if(isSlash) bot.replyPublicDelayed(message, toReturn);
	else bot.replyPublic(message, toReturn);
};

GachaService.prototype._battle = function* (bot, message, character) {
	// Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	
	var haveCharacter = yield db.collection("user_pulls").find({user_id: message.user_id, name: character}).limit(1).toArray();
	if(haveCharacter.length < 1){
		bot.replyPrivateDelayed(message, "You don't have " + character);
		db.close();
		return;
	}
	haveCharacter = haveCharacter[0];
	var battle = yield db.collection("battles").find({channel_id: message.channel_id}).limit(1).toArray();
	if(battle.length < 1){
		yield db.collection("battles").insertOne({channel_id: message.channel_id, user_id: message.user_id, user_name: message.user_name, name: haveCharacter.name, stars: haveCharacter.stars});
		bot.replyPublicDelay(message, message.user_name + " sends out ” + haveCharacter.name + this._printStars(haveCharacter.stars);
	} else {
		battle = battle[0];
		if(battle.user_id === message.user_id){
			bot.replyPrivateDelay(message, "You already sent out a character.");
			db.close();
			return;
		}
		
		var toSend = battle.name + this._printStars(battle.stars) +
			"  vs " + haveCharacter.name + this._printStars(haveCharacter.stars);
			
		if(Math.random() > 0.5) {
			toSend += "\n" + battle.name + this._printStars(battle.stars) + " won!\n" +
			haveCharacter.name + this._printStars(haveCharacter.stars) +
			" got salty and left " + message.user_name;
			
			yield db.collection("user_pulls").findOneAndDelete(haveCharacter);
		} else{
			toSend += "\n" + haveCharacter.name + this._printStars(haveCharacter.stars) + " won!\n" +
			battle.name + this._printStars(battle.stars) +
			" got salty and left " + battle.user_name;
			
			yield db.collection("user_pulls").findOneAndDelete({user_id: battle.user_id, name: battle.name, stars: battle.stars});
		}
		yield db.collection("battles").findOneAndDelete(battle);
	}
	
	db.close();
};

GachaService.prototype._exceptionCo = function(bot, message, errorMessage, isSlash, err){
    console.log(err.stack);
    if(isSlash) bot.replyPrivateDelayed(message, errorMessage);
};

GachaService.prototype.resolveSlash = function (bot, message) {
    if (message.token !== process.env.GACHA_TOKEN) return false;
	bot.replyAcknowledge();
    var text = message.text.trim().split(" ");
    switch(text[0]){
        case "add":
            coroutine(this._addCharacter.bind(this, bot, message, text[1]))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to add " + text[1], true));
            break;
        case "list":
            coroutine(this._listCharacters.bind(this, bot, message))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to list characters", true));
            break;
        case "pull":
            coroutine(this._pullCharacter.bind(this, bot, message, true))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to pull... wtf", true));
            break;
			case "battle":
				coroutine(this._battle.bind(this, bot, message, text[1]))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to send out " + text[1], true));
				break;
        default:
            bot.replyPrivateDelayed(message, "add [character]\nlist [mine, pool]\npull\nbattle [character]");
    }
    return true;
};

GachaService.prototype.resolveOutHook = function (bot, message) {
    if (message.token !== process.env.GACHA_PULL_TOKEN) return false;
    coroutine(this._pullCharacter.bind(this, bot, message))
	.catch(this._exceptionCo.bind(this, bot, message, "failed to pull... wtf"));
    return true;
};

module.exports = GachaService;
