const babel = require("@babel/parser");
const microBot = require("micro-bot");
const Composer = microBot.Composer;
const log = microBot.log;
const session = microBot.session;
const bot = new microBot.Composer();
bot.use(microBot.log());
bot.use(microBot.session());
bot.start(ctx => ctx.reply("Send me JavaScript source code, and I'll give you the Babel Abstract Syntax Tree!"));
bot.on("message", function (ctx) {
	try {
		ctx.reply(babel.parse(ctx.message));
	} catch (error) {
		ctx.reply(error.message);
	}
});
module.exports = bot;
