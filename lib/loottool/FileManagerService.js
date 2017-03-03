var coroutine = require('co');
var MongoDb = require('mongodb');
var MongoClient = MongoDb.MongoClient;
var MongoObjectId = MongoDb.ObjectId;

var CommandService = require('./CommandService');

var FileManagerService = function ()
{
    CommandService.call(this);
};

FileManagerService.prototype = Object.create(CommandService.prototype);

FileManagerService.prototype.constructor = FileManagerService;

FileManagerService.prototype.delete = function (bot, message, user)
{
    bot.api.files.list({ token: bot.config.bot.app_token }, function (err, response)
    {
        if (!response.files) {
            bot.replyPrivateDelayed(message, "Failed to get files.");
            return;
        }
        bot.replyPrivateDelayed(message, "Nuking " + response.files.length + " files.");
        this.forcePostPublic(bot, message, "Nuking " + response.files.length + " files. Blame " + user.name + " for deleting your precious files. (And memes.)");
        for (var i = 0; i < response.files.length; ++i) {
            bot.api.files.delete({ token: bot.config.bot.app_token, file: response.files[i].id }, function (err2, response2)
            {
                console.log(err2);
            });
        }

        bot.replyPublicDelayed(message, "Nuked " + response.files.length + " files. Remember, blame " + user.name + " for deleting your precious files. (And memes.)");
    }.bind(this));
};

FileManagerService.prototype.deleteConfirmation = function (bot, message)
{
    bot.replyPrivateDelayed(message,
        {
            text: "Are you sure to nuke lots of files?",
            attachments: [
                {
                    fallback: "Platform not supported, use a supported platform.",
                    callback_id: "FileManagerService",
                    actions: [
                        {
                            name: "yes",
                            text: "Yes",
                            type: "button",
                            style: "danger"
                        },
                        {
                            name: "no",
                            text: "No",
                            type: "button",
                        }
                    ]
                }
            ]
        }
        );
};

FileManagerService.prototype.resolveSlash = function (bot, message)
{
    if (message.token !== process.env.FILE_MANAGER_TOKEN
	&& message.command !== process.env.FILE_MANAGER_COMMAND) return false;
    if (!message.text.toLowerCase().includes("delete")) return false;
    bot.replyAcknowledge();

    bot.api.users.info({ token: bot.config.bot.app_token, user: message.user_id },
		function (err, response)
		{
		    if (!response.user) {
		        bot.replyPrivateDelayed(message, "Failed to get info.");
		        return;
		    }
		    if (!response.user.is_admin) {
		        bot.replyPrivateDelayed(message, "You are not an admin.");
		        this.forcePostPublic(bot, message, message.user_name + " is attempting to delete files, but is not admin...");
		    }
		    else {
		        this.deleteConfirmation(bot, message);
		    }
		}.bind(this));
    return true;
};

FileManagerService.prototype.resolveInteractive = function (bot, message)
{
    if (message.callback_id !== "FileManagerService") return false;
    bot.replyAcknowledge();
    switch (message.actions[0].name) {
        case "yes":
            this.getUserInfo(bot, message, this.delete.bind(this, bot, message), true);
            break;
        default:
            bot.replyPrivateDelayed(message, "Not nuking files.");
    }
    return true;
};

module.exports = FileManagerService;