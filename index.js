const babel = require("babel-core");
const Telegraf = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
function spinWait(duration) {
	const end = performance.now() + duration;
	while (performance.now() < end);
}
function htmlEncode(str) {
	return str.replace(/<|>|&/g, m => ({
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;'
	})[m]);
}
function monospace(str) {
	return "<code>" + htmlEncode(str) + "</code>";
}
function chunkString(str, size) {
	const numChunks = Math.ceil(str.length / size);
	const chunks = new Array(numChunks);
	for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
		chunks[i] = str.substr(o, size);
	}
	return chunks;
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
	addVisitor(babel.types.STATEMENT_TYPES, visitor);
	addVisitor(babel.types.EXPRESSION_TYPES, visitor);
	addVisitor(babel.types.LITERAL_TYPES, visitor);
	addVisitor(babel.types.SCOPABLE_TYPES, visitor);
	visitor.ClassBody = locPropRemover;
	visitor.DirectiveLiteral = locPropRemover;
	visitor.Directive = locPropRemover;
	return { visitor: visitor };
}
function genAst(code) {
	const ast = babel.transform(code, {
		plugins: [locRemover]
	}).ast.program;
	delete ast.loc;
	delete ast.start;
	delete ast.end;
	return ast;
}
async function replyCode(str, ctx) {
	if (str.length > 4083) {
		const chunks = chunkString(str, 4083);
		for (const chunk of chunks) {
			if (chunk.length === 0) continue;
			await ctx.replyWithHTML(monospace(chunk));
		}
	} else {
		ctx.replyWithHTML(monospace(str));
	}
}
bot.on("message", function (ctx, next) {
	console.log(ctx.message);
	next(ctx);
});
bot.start(ctx => ctx.replyWithHTML("Send me JavaScript source code, and I'll give you the Babel Abstract Syntax Tree!\nType <code>/help</code> for a list of commands."));
bot.command("help", function (ctx) {
	ctx.replyWithHTML("To use this bot, just send it JavaScript source code.\nCommands:\n<code>/single &lt;expression&gt;</code> Parse a single expression.");
});
bot.command("single", function (ctx) {
	try {
		const ast = genAst(ctx.message.text.substr(7, ctx.message.length));
		if (ast.body.length === 0) {
			if (ast.directives.length === 0) ctx.reply("No code was given.");
			else replyCode(JSON.stringify(ast.directives[0], null, "\t"), ctx);
		} else {
			replyCode(JSON.stringify(ast.body[0], null, "\t"), ctx);
		}
	} catch (error) {
		replyCode(error.message, ctx);
		console.error(error);
	}
});
bot.on("message", function (ctx) {
	try {
		replyCode(JSON.stringify(genAst(ctx.message.text), null, "\t"), ctx);
	} catch (error) {
		replyCode(error.message, ctx);
		console.error(error);
	}
});
bot.launch();
