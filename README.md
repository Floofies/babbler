# babbler
A Telegram bot which converts JavaScript into an Abstract Syntax Tree using Babel.

To use the bot, just send JavaScript source code directly to it or use one of the below commands.

## Commands

- `/parse <code>` - Parses source code into a `Program` AST node. Sending source code
- `/single <code>` - Parses a single atom of source code. (One expression, statement, etc...)
- `/help` *(or)* `/babblerhelp` - Shows a list of commands.

## `/parse` Command Usage or Direct Message

One of these messages is sent to the bot:
```JavaScript
console.log("Hello World!");
```
*(or)*
```
/parse console.log("Hello World!");
```

This message is recieved from the bot:
```JSON
{
	"type": "Program",
	"sourceType": "module",
	"body": [
		{
			"type": "ExpressionStatement",
			"expression": {
				"type": "CallExpression",
				"callee": {
					"type": "MemberExpression",
					"object": {
						"type": "Identifier",
						"name": "console"
					},
					"property": {
						"type": "Identifier",
						"name": "log"
					},
					"computed": false
				},
				"arguments": [
					{
						"type": "StringLiteral",
						"extra": {
							"rawValue": "Hello World!",
							"raw": "\"Hello World!\""
						},
						"value": "Hello World!"
					}
				]
			}
		}
	],
	"directives": []
}
```

## 2: `/single` Command Usage

This message is sent directly to the bot:
```/single hello```

This message is recieved from bot:
```JSON
{
	"type": "ExpressionStatement",
	"expression": {
		"type": "Identifier",
		"name": "hello"
	}
}
```