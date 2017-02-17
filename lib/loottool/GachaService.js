var coroutine = require('co');
var MongoClient = require('mongodb').MongoClient;
var CommandService = require('./lib/loottool/CommandService');

var GachaService = function () {

};

GachaService.prototype = Object.create(CommandService.prototype);

GachaService.prototype.constructor = GachaService;

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
            var messageString =  "added " + character;
            for(var i = 0; i < star; ++i){
                messageString += "\u2605";
            }
            bot.replyPublic(message, messageString);
        }
        catch (e){
            console.dir(e);
        }
    } else{
        try{
            bot.replyPrivate(message, "already added " + character);
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

    var list = db.collection("characters").find({});
    var listString = "";
    while(yield list.hasNext()) {
        var character = yield list.next();
        listString += character.name;
        for(var i = 0; i < character.stars; ++i){
            listString += "\u2605";
        }
        listString += "\n";
    }
    // Close the connection
    db.close();

    bot.replyPrivate(message, listString);
};

GachaService.prototype._pullCharacter = function*(bot, message) {
    // Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);

    var list = yield db.collection("characters").find({}).toArray();
    var randomnumber = Math.floor(Math.floor(Math.random() * 1000) % list.length);
    var toReturn = list[randomnumber].name;
    for(var i = 0; i < list[randomnumber].stars; ++i){
        toReturn += "\u2605";
    }
    // Close the connection
    db.close();

    bot.replyPublic(message, toReturn);
};

GachaService.prototype._exceptionCo = function(bot, message, errorMessage, err){
    console.log(err.stack);
    bot.replyPrivate(message, errorMessage);
}

GachaService.prototype.resolveSlash = function (bot, message) {
    if (message.token !== process.env.GACHA_TOKEN) return false;
    var text = message.text.trim().split(" ");
    switch(text[0]){
        case "add":
            coroutine(this._addCharacter.bind(this, bot, message, text[1]))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to add " + text[1]));
            break;
        case "list":
            coroutine(this._listCharacters.bind(this, bot, message))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to list characters"));
            break;
        case "pull":
            coroutine(this._pullCharacter.bind(this, bot, message))
                .catch(this._exceptionCo.bind(this, bot, message, "failed to pull... wtf"));
            break;
        default:
            bot.replyPrivate(message, "add [character]\nlist\npull");
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
