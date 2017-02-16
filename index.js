/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ______    ______    ______   __  __    __    ______
 /\  == \  /\  __ \  /\__  _\ /\ \/ /   /\ \  /\__  _\
 \ \  __<  \ \ \/\ \ \/_/\ \/ \ \  _"-. \ \ \ \/_/\ \/
 \ \_____\ \ \_____\   \ \_\  \ \_\ \_\ \ \_\   \ \_\
 \/_____/  \/_____/    \/_/   \/_/\/_/  \/_/    \/_/


 This is a sample Slack Button application that provides a custom
 Slash command.

 This bot demonstrates many of the core features of Botkit:

 *
 * Authenticate users with Slack using OAuth
 * Receive messages using the slash_command event
 * Reply to Slash command both publicly and privately

 # RUN THE BOT:

 Create a Slack app. Make sure to configure at least one Slash command!

 -> https://api.slack.com/applications/new

 Run your bot from the command line:

 clientId=<my client id> clientSecret=<my client secret> PORT=3000 node bot.js

 Note: you can test your oauth authentication locally, but to use Slash commands
 in Slack, the app must be hosted at a publicly reachable IP or host.


 # EXTEND THE BOT:

 Botkit is has many features for building cool and useful bots!

 Read all about it here:

 -> http://howdy.ai/botkit

 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');
var env = {
	PORT: 8888,
}

if(process.env.PORT){
	env.PORT = process.env.PORT;
}

var config = {}
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: './db_slackbutton_slash_command/',
    };
}

var controller = Botkit.slackbot(config);

controller.setupWebserver(env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);
});


//
// BEGIN EDITING HERE!
//

var dict =
{
	'r': ":arr:",
	'a': ":ay:",
	'b': ":be:",
	'c': ":cee:",
	'd': ":dee:",
	'w': ":dubyoo:",
	'e': ":ee:",
	'f': ":eff:",
	'x': ":ehcks:",
	'l': ":ell:",
	'm': ":emm:",
	'n': ":en:",
	's': ":ess:",
	'g': ":gee:",
	'h': ":hhh:",
	'i': ":iii:",
	'j': ":jay:",
	'k': ":kay:",
	'o': ":ooo:",
	'p': ":pee:",
	'q': ":queue:",
	't': ":tee:",
	'v': ":vee:",
	'y': ":why:",
	'u': ":yoo:",
	'z': ":zee:",
	'0': ":0:",
	'1': ":1:",
	'2': ":2:",
	'3': ":3:",
	'4': ":4:",
	'5': ":5:",
	'6': ":6:",
	'7':":7:",
	'8':":8:",
	'9':":9:",
};

var coroutine = require('co');
var MongoClient = require('mongodb').MongoClient;
var addCharacter = function* (slashCommand, message, character) {
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
            slashCommand.replyPublic(message, messageString);
        }
        catch (e){
            console.dir(e);
        }
    } else{
        try{
            slashCommand.replyPrivate(message, "already added " + character);
        }
        catch (e){
            console.dir(e);
        }
    }
    // Close the connection
    db.close();
};

var listCharacters = function*(slashCommand, message) {
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

    slashCommand.replyPrivate(message, listString);
};

var pullCharacter = function*(slashCommand, message){
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

    slashCommand.replyPublic(message, toReturn);
};

var exceptionCo = function(slashCommand, message, errorMessage, err){
    console.log(err.stack);
    slashCommand.replyPrivate(message, errorMessage);
}

controller.on('slash_command', function (slashCommand, message) {
    switch (message.command) {
        case "/blockify":
            var regex = /(:\w+:)([\s\S]*)/gm;
            var results = regex.exec(message.text);
            var text;
            if (results !== null)
                text = results[2].trim().toLowerCase();
            else
                text = message.text.toLowerCase();
			if (text.length < 1) {
			    slashCommand.replyPrivate(message, "Please give me text to process.");
			    break;
			}
			console.log(text);
			var toSend = "";
			for (var i = 0; i < text.length; ++i)
			{
				if (dict[text.charAt(i)] !== undefined)
				{
				    toSend += dict[text.charAt(i)];
				}
				else if(text.charAt(i) === "\n")
				{
				    toSend += text.charAt(i);
				}
				else
				{
				    if (results !== null)
				        toSend += results[1];
                    else toSend += ":spc:";
				}
			}
			slashCommand.replyPublic(message, toSend);
			break;
        case "/gacha":
            var text = message.text.trim().split(" ");
            switch(text[0]){
                case "add":
                    coroutine(addCharacter.bind(this, slashCommand, message, text[1])).catch(exceptionCo.bind(this, slashCommand, message, "failed to add " + text[1]));
                    break;
                case "list":
                    coroutine(listCharacters.bind(this, slashCommand, message)).catch(exceptionCo.bind(this, slashCommand, message, "failed to list characters"));
                    break;
                case "pull":
                    coroutine(pullCharacter.bind(this, slashCommand, message)).catch(exceptionCo.bind(this, slashCommand, message, "failed to pull... wtf"));
                    break;
                default:
                    slashCommand.replyPrivate(message, "I'm afraid I don't know how to " + text[0] + " yet.");
            }
            break;
        default:
            slashCommand.replyPrivate(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }

})
;

controller.on('outgoing_webhook',function(bot,message) {
    console.log(message.text);
    if(!message.text.includes("/gacha") && message.text.includes("dreams;pull;")){
        coroutine(pullCharacter.bind(this, bot, message)).catch(exceptionCo.bind(this, slashCommand, message, "failed to pull... wtf"));
    }
});
