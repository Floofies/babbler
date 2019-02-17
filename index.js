const babel = require("babel-core");
const Telegraf = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
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
function trimCommand(command, str) {
	if (str[command.length + 1] === "@") return str.substr(command.length + 14, str.length);
	return str.substr(command.length + 1, str.length);
}
function locPropRemover(path) {
	delete path.node.start;
	delete path.node.end;
	delete path.node.loc;
}
function addVisitor(types, visitor) {
	for (const type of types) visitor[type] = locPropRemover;
}
const visitor = {};
const visitorWrap = { visitor: visitor };
addVisitor(babel.types.STATEMENT_TYPES, visitor);
addVisitor(babel.types.EXPRESSION_TYPES, visitor);
addVisitor(babel.types.LITERAL_TYPES, visitor);
addVisitor(babel.types.SCOPABLE_TYPES, visitor);
visitor.ClassBody = locPropRemover;
visitor.DirectiveLiteral = locPropRemover;
visitor.Directive = locPropRemover;
function locRemover() {
	return visitorWrap;
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
async function astReply(source, ctx) {
	try {
		const ast = genAst(source);
		if (ast.body.length === 0 && ast.directives.length === 0) return ctx.reply("No code was given.");
		replyCode(JSON.stringify(ast, null, "\t"), ctx);
	} catch (error) {
		replyCode(error.message, ctx);
		console.error(error);
	}
}
function helpReply(ctx) {
	ctx.replyWithHTML("Commands:\n<code>/parse &lt;code&gt;</code> Parse source code.\n<code>/single &lt;code&gt;</code> Parse a single atom of source code.");
}
bot.on("message", function (ctx, next) {
	if ("reply_to_message" in ctx.message && ctx.message.reply_to_message.from.username !== "babblerjsbot") return;
	console.log(ctx.message);
	next(ctx);
});
bot.start(function (ctx) {
	ctx.replyWithHTML("Send JavaScript code, get a Babel Abstract Syntax Tree.\nType <code>/help</code> or <code>/babblerhelp</code> for a list of commands.")
});
bot.command("help", helpReply);
bot.command("babblerhelp", helpReply);
bot.command("parse", async function (ctx) {
	astReply(trimCommand("parse", ctx.message.text), ctx);
});
bot.command("single", async function (ctx) {
	try {
		const ast = genAst(trimCommand("single", ctx.message.text));
		if (ast.body.length === 0) {
			if (ast.directives.length === 0) ctx.reply("No code was given.");
			else await replyCode(JSON.stringify(ast.directives[0], null, "\t"), ctx);
		} else {
			await replyCode(JSON.stringify(ast.body[0], null, "\t"), ctx);
		}
	} catch (error) {
		replyCode(error.message, ctx);
		console.error(error);
	}
});
bot.on("message", ctx => astReply(ctx.message.text, ctx));
bot.catch(error => console.error(error));
bot.launch();
