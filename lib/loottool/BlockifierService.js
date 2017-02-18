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

BlockifierService.prototype._process = function (bot, message) {
	console.dir(message);
    var regex = /(:\w+:)([\s\S]*)/gm;
    var results = regex.exec(message.text);
    var text;
    if (results !== null)
        text = results[2].trim().toLowerCase();
    else
        text = message.text.toLowerCase();
    if (text.length < 1) {
        bot.replyPrivateDelayed(message, "Please give me text to process.");
        return true;
    }
    console.log(text);
    var toSend = "";
    for (var i = 0; i < text.length; ++i) {
        if (this._dic[text.charAt(i)] !== undefined) {
            toSend += this._dic[text.charAt(i)];
        }
        else if (text.charAt(i) === "\n") {
            toSend += text.charAt(i);
        }
        else {
            if (results !== null)
                toSend += results[1];
            else toSend += ":spc:";
        }
    }
	toSend += "\n-" + message.user_name;
    bot.replyPublicDelayed(message, toSend);
};

BlockifierService.prototype.resolveSlash = function (bot, message) {
    if (message.token !== process.env.BLOCKIFIER_TOKEN
	&& message.command !== process.env.BLOCKIFIER_COMMAND) return false;
	bot.replyAcknowledge(this._process.bind(this, bot, message));
    return true;
};

module.exports = BlockifierService;
