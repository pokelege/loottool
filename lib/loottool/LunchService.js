var CommandService = require('./CommandService');
var MongoDb = require('mongodb');
var MongoClient = MongoDb.MongoClient;
var MongoObjectId = MongoDb.ObjectId;

var LunchService = function () {
    CommandService.call(this);
};

LunchService.prototype = Object.create(CommandService.prototype);

LunchService.prototype.constructor = LunchService;

LunchService.prototype._dayz = {
	"everyday": 0,
	"monday": 1,
	"tuesday": 2,
	"wednesday": 3,
	"thursday": 4,
	"friday": 5
};

LunchService.prototype._add = funtion(bot, message, day, location) {
	// Connection URL
    var url = process.env.MONGOLAB_URI;
    // Use connect method to connect to the Server
    var db = yield MongoClient.connect(url);
	var dayInt = this._dayz[day.toLowerCase()];
	if (dayInt === undefined) dayInt = 0;
	yield db.collection("lunch").insertOne({team_id: message.team_id, day: dayInt, location: location});
	bot.replyPublicDelayed(message, message.user_name + " added\n" + location + "\nfor " + Object.keys(this._dayz)[dayInt]);
};

LunchService.prototype.resolveSlash = function (bot, message) {
    if (message.token !== process.env.LUNCH_TOKEN
	&& message.command !== process.env.LUNCH_COMMAND) return false;
	bot.replyAcknowledge();
	if(message.text.includes("add")) {
		
	}
    return true;
};
