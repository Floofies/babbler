const babel = require("babel-core");
const Telegraf = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
function monospace(str) {
	return "<code>" + str + "</code>";
}
function locPropRemover(path) {
	delete path.node.start;
	delete path.node.end;
	delete path.node.loc;
}
function addVisitor(types, visitor) {
	for (const type of types) visitor[type] = locPropRemover;
}
function locRemover(babel) {
	const visitor = {};
	addVisitor(babel.types.DECLARATION_TYPES, visitor);
	addVisitor(babel.types.STATEMENT_TYPES, visitor);
	addVisitor(babel.types.EXPRESSION_TYPES, visitor);
	addVisitor(babel.types.LITERAL_TYPES, visitor);
	return {visitor: visitor};
}
bot.start(ctx => ctx.reply("Send me JavaScript source code, and I'll give you the Babel Abstract Syntax Tree!"));
bot.on("message", function (ctx) {
	console.log(ctx.message);
	try {
		const ast = babel.transform(ctx.message.text, {
			plugins: [locRemover]
		}).ast.program;
		delete ast.loc;
		delete ast.start;
		delete ast.end;
		ctx.replyWithHTML(monospace(JSON.stringify(ast, null, "\t")));
	} catch (error) {
		ctx.replyWithHTML(monospace(error.message));
		console.error(error);
	}
});
bot.launch();
