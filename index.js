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
	CLIENT_ID: "136415683815.141664100823",
	CLIENT_SECRET: "55661a68b7b751055f2d39de8cb98713",
	PORT: 8888,
	VERIFICATION_TOKEN: "yKUPP5C5LSc0eq84l9v9SH3y"
}

if(process.env.CLIENT_ID){
	env.CLIENT_ID = process.env.CLIENT_ID;
}

if(process.env.CLIENT_SECRET){
	env.CLIENT_SECRET = process.env.CLIENT_SECRET;
}

if(process.env.PORT){
	env.PORT = process.env.PORT;
}

if(process.env.VERIFICATION_TOKEN){
	env.VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;
}

var config = { hostname:"52.24.204.8" }
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

var controller = Botkit.slackbot(config).configureSlackApp(
    {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        scopes: ['commands'],
        hostname: "52.24.204.8"
    }
);

controller.setupWebserver(env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
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

controller.on('slash_command', function (slashCommand, message) {
    switch (message.command) {
        case "/echo": //handle the `/echo` slash command. We might have others assigned to this app too!
            // The rules are simple: If there is no text following the command, treat it as though they had requested "help"
            // Otherwise just echo back to them what they sent us.

            // but first, let's make sure the token matches!
            if (message.token !== env.VERIFICATION_TOKEN) return; //just ignore it.

            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                slashCommand.replyPrivate(message,
                    "I echo back what you tell me. " +
                    "Try typing `/echo hello` to see.");
                return;
            }

            // If we made it here, just echo what the user typed back at them
            //TODO You do it!
            slashCommand.replyPublic(message, "1", function() {
                slashCommand.replyPublicDelayed(message, "2").then(slashCommand.replyPublicDelayed(message, "3"));
            });

            break;
        case "/blockify":
            var regex = /(:\w+:)(.*)/g;
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

			var toSend = "";
			for (var i = 0; i < text.length; ++i)
			{
				if (dict[text.charAt(i)] !== undefined)
				{
				    toSend += dict[text.charAt(i)];
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
        default:
            slashCommand.replyPrivate(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }

})
;

