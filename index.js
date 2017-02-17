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

config.hostname = '0.0.0.0';
config.debug = false;
var controller = Botkit.slackbot(config);

controller.setupWebserver(env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);
});
var BlockifierService = require('./lib/loottool/BlockifierService');
var GachaService = require('./lib/loottool/GachaService');
var services = [new BlockifierService(),
				new GachaService()];

//
// BEGIN EDITING HERE!
//

controller.on('slash_command', function (slashCommand, message) {
    for (var i = 0; i < services.length; ++i) {
		if(services[i].resolveSlash(slashCommand, message)){
			return;
		}
	}
	bot.replyPrivate(message, "I don't understand: " + message.command);
})
;

controller.on('outgoing_webhook',function(bot,message) {
	for(var i = 0; i < services.length; ++i){
		if(services[i].resolveOutHook(bot, message)){
			return;
		}
	}
	  bot.replyPrivate(message, "I don't understand: " + message.trigger_word);
});
