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
	const numChunks = Math.ceil(str.length / size)
	const chunks = new Array(numChunks)

	for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
		chunks[i] = str.substr(o, size)
	}

	return chunks
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
	visitor.DirectiveLiteral = locPropRemover;
	return { visitor: visitor };
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
		const astString = JSON.stringify(ast, null, "\t");
		if (astString.length > 4083) {
			const chunks = chunkString(astString, 4083);
			console.log(chunks);
			for (const chunk of chunks) {
				if (chunk.length === 0) continue;
				ctx.replyWithHTML(monospace(chunk));
			}
		} else {
			ctx.replyWithHTML(monospace(astString));
		}
	} catch (error) {
		ctx.replyWithHTML(monospace(error.message));
		console.error(error);
	}
});
bot.launch();
