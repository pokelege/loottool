var CommandService = require('./CommandService');
var BlockifierService = function () {
    CommandService.call(this);
};

BlockifierService.prototype = Object.create(CommandService.prototype);

BlockifierService.prototype.constructor = BlockifierService;

BlockifierService.prototype._dic =
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
    '7': ":7:",
    '8': ":8:",
    '9': ":9:",
};

BlockifierService.prototype._process = function (text, emoji, error, message, reply) {
	if(error){
		console.log(error);
		return;
	}
    var toSend = "";
    for (var i = 0; i < text.length; ++i) {
        if (this._dic[text.charAt(i)] !== undefined) {
            toSend += this._dic[text.charAt(i)];
        }
        else if (text.charAt(i) === "\n") {
            toSend += text.charAt(i);
        }
        else {
            toSend += emoji;
        }
    }
    reply(toSend);
};

BlockifierService.prototype.resolveSlash = function (bot, message) {
    if (message.token !== process.env.BLOCKIFIER_TOKEN) return false;
	var regex = /(:\w+:)([\s\S]*)/gm;
    var results = regex.exec(message.text);
    var text;
	var emoji = ":spc:";
    if (results !== null){
        text = results[2].trim().toLowerCase();
		emoji = results[1];
		}
    else
        text = message.text.toLowerCase();
    if (text.length < 1) {
        bot.replyPrivate(message, "Please give me text to process.");
        return true;
    }
	bot.replyAndUpdate(message, "Blockifying: " + message.text, 
	this._process.bind(this, text, emoji));
    return true;
};

module.exports = BlockifierService;
