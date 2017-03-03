var coroutine = require('co');
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
	"sunday": 0,
	"monday": 1,
	"tuesday": 2,
	"wednesday": 3,
	"thursday": 4,
	"friday": 5,
	"saturday": 6
};

LunchService.prototype._add = function*(bot, message, day, location) {
	// Connection URL
	var url = process.env.MONGOLAB_URI;
	// Use connect method to connect to the Server
	var db = yield MongoClient.connect(url);
	var dayInt = this._dayz[day.toLowerCase()];
	if (dayInt === undefined) {
		dayInt = new Date().getUTCDate();
		var zone = db.collection("team_zone").find({team_id: message.team_id}).limit(1);
		if(yield zone.hasNext())
		{
			var timezone = yield zone.next();
			timezone = timezone.utc;
			var diff = new Date().getUTCHours() + timezone;
			var local = new Date().getUTCDate() + ( diff < 0 ? -1 : diff >= 24 ? 1 : 0);
			while(local < 0) local += 6;
			local %= 6;
			dayInt = local;
		}
	}
	yield db.collection("lunch").insertOne({team_id: message.team_id, day: dayInt, location: location});
	db.close();
	bot.replyPublicDelayed(message, message.user_name + " added\n" + location + "\nfor " + Object.keys(this._dayz)[dayInt]);
};

LunchService.prototype._remove = function*(bot, message, day, location) {
	// Connection URL
	var url = process.env.MONGOLAB_URI;
	// Use connect method to connect to the Server
	var db = yield MongoClient.connect(url);
	var dayInt = this._dayz[day.toLowerCase()];
	if (dayInt === undefined) {
		dayInt = new Date().getUTCDate();
		var zone = db.collection("team_zone").find({team_id: message.team_id}).limit(1);
		if(yield zone.hasNext())
		{
			var timezone = yield zone.next();
			timezone = timezone.utc;
			var diff = new Date().getUTCHours() + timezone;
			var local = new Date().getUTCDate() + ( diff < 0 ? -1 : diff >= 24 ? 1 : 0);
			while(local < 0) local += 6;
			local %= 6;
			dayInt = local;
		}
	}
	yield db.collection("lunch").deleteOne({team_id: message.team_id, day: dayInt, location: location});
	db.close();
	bot.replyPublicDelayed(message, message.user_name + " added\n" + location + "\nfor " + Object.keys(this._dayz)[dayInt]);
};

LunchService.prototype._setTimeZone = function*(bot, message, time){
	// Connection URL
	var url = process.env.MONGOLAB_URI;
	// Use connect method to connect to the Server
	var db = yield MongoClient.connect(url);
	var timezone = parseInt(time, 10);
	yield db.collection("team_zone").updateOne({team_id: message.team_id},{$set:{utc: timezone}}, {upsert: true});
	db.close();
	bot.replyPrivateDelayed(message, "Updated timezone");
}

LunchService.prototype._suggest = function*(bot, message)
{
	// Connection URL
	var url = process.env.MONGOLAB_URI;
	// Use connect method to connect to the Server
	var db = yield MongoClient.connect(url);
	var dayInt = new Date().getUTCDate();
	var zone = db.collection("team_zone").find({team_id: message.team_id}).limit(1);
	if(yield zone.hasNext())
	{
		var timezone = yield zone.next();
		timezone = timezone.utc;
		var diff = new Date().getUTCHours() + timezone;
		var local = new Date().getUTCDate() + ( diff < 0 ? -1 : diff >= 24 ? 1 : 0);
		while(local < 0) local += 6;
		local %= 6;
		dayInt = local;
	}
	var counts = yield db.collection("lunch").count({team_id: message.team_id, day: dayInt});
	var randomnumber = Math.floor(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) % counts);
	var lunch = db.collection("lunch").find({team_id: message.team_id, day: dayInt}).skip(randomnumber).limit(1);
	if(yield lunch.hasNext()){
		lunch = yield lunch.next();
		bot.replyPublicDelayed(message, "Today's lunch is " + lunch.location);
	} else {
		bot.replyPrivateDelayed(message, "There is no entry for " + Object.keys(this._dayz)[dayInt]);
}
db.close();
};

LunchService.prototype._list = function*(bot, message){
	// Connection URL
	var url = process.env.MONGOLAB_URI;
	// Use connect method to connect to the Server
	var db = yield MongoClient.connect(url);
	var dayKeys = Object.keys(this._dayz);
	var attachments = [];
	for(var i = 0; i < dayKeys.length;++i){
		var attach = {text: "", fallback: ""};
		attach.text = dayKeys[i] + "\n";
		var lunch = yield db.collection("lunch").find({team_id: message.team_id, day: i});
		while(yield lunch.hasNext()){
			var lunchItem = yield lunch.next();
			attach.text += lunchItem.location + "\n";
		}
		attach.fallback = attach.text;
		attachments.push(attach);
	}
	bot.replyPrivateDelayed(message, {attachments: attachments});
	db.close();
};

LunchService.prototype.resolveSlash = function (bot, message) {
	if (message.token !== process.env.LUNCH_TOKEN
	&& message.command !== process.env.LUNCH_COMMAND) return false;
	bot.replyAcknowledge();
	if(message.text.includes("add")) {
		var addRegex = /add\s([sS]unday)?([mM]onday)?([tT]uesday)?([wW]ednesday)?([Tt]hursday)?([Ff]riday)?([Ss]aturday)?\s*([\s\S]*)/gm;
		var results = addRegex.exec(message.text);
		if(results === null){
			bot.replyPrivateDelayed(message, "Failed to add entry.");
			return true;
		}
		var day = undefined;
		for(var i = 1; i < 8; ++i)
		{
			if(results[i])
			{
				day = i;
				break;
			}
		}
		coroutine(this._add.bind(this, bot, message, day, results[8]));
	} else if(message.text.includes("time")){
		coroutine(this._setTimeZone.bind(this, bot, message, message.text.trim().split(" ")[1]));
	} else if(message.text.includes("list")){
		coroutine(this._list.bind(this, bot, message));
	}
	else {
		coroutine(this._suggest.bind(this,bot, message));
	}
	return true;
};
module.exports = LunchService;