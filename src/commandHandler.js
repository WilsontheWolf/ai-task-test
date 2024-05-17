import ansi from "./ANSI.js";

const commandRegex = /^> (\S+)(?: ([^\n]+))?/m;

const commands = [
    {
        name: 'help',
        description: 'Shows additional help about commands',
        usage: '[command]',
        aliases: ['h', '?'],
        additionalInfo: 'If a command is provided, it will show additional help about that command. Else it will just show the list of commands.',
        exec: function (args) {
            if (args) {
                let commandObj = commands.find(c => c.name === args);
                if (!commandObj) {
                    return `Error: Command "${args}" not found. Run "help" to see the list of commands.`;
                }
                return `${commandObj.name} ${commandObj.usage ? `${commandObj.usage}` : ''} - ${commandObj.description}${commandObj.additionalInfo ? `\n${commandObj.additionalInfo}` : ''}`;
            }
            return `Args wrapped in [] are optional.\n${commands.map(command => `${command.name} ${command.usage ? `${command.usage}` : ''} - ${command.description}`).join('\n')}`;
        },
    },
    {
        name: 'request',
        description: 'Prints the request that you must complete.',
        usage: '',
        exec: function (args, handler) {
            return "Here is the request you must fulfill:\n" + handler.request + (handler.alreadySent ? '\n\nNote: You have already sent the message. As such, you may have completed the request.' : '');
        },
    },
    {
        name: 'date',
        description: 'Shows the user\'s current time and date.',
        usage: '',
        exec: function () {
            return new Date().toString();
        },
    },
    {
        name: 'send',
        description: 'Send a message to the user. NOTE: The user cannot respond.',
        usage: 'TEXT',
        additionalInfo: 'TEXT is the message you want to send to the user. If you are sending a message with newlines, make sure to escape them with a \\ before each newline.'
            + '\n Example: "> send Hello\\\nWorld!" will send "Hello\\nWorld!" to the user.'
            + '\n Note: the user cannot respond. As such, do not wait for a response.',
        exec: async function (args, handler) {
            if (!args) {
                return 'Error: No message provided.';
            }
            handler.alreadySent = true;
            return await Promise.resolve(handler.callbackHandler({ type: 'message', content: args }))
                .then(() => 'Message sent. If you are done with the request, run "> done".')
                .catch(e => `Error: ${e}`);
        },
    },
    {
        name: 'userinfo',
        description: 'Shows information about the user who made the request.',
        usage: '',
        exec: function (args, handler) {
            return "Here is some info about the user who made the request:\n" + handler.callbackHandler({ type: 'userinfo' });
        },
    },
    {
        name: 'note',
        description: 'Run this command to put down your thoughts.',
        usage: '',
        exec: function (args) {
            return args ? `Note: ${args}` : undefined;
        },
    },
    {
        name: 'done',
        description: 'Finishes the exchange.',
        usage: '',
        exec: function (args, handler) {
            if (!handler.alreadySent && !handler.doneRepeat) {
                handler.doneRepeat = true;
                return 'Error: You have not sent a message. Are you sure you are done? If you are, run "done" again. If you are not, run "send" to send a message.';
            }
            return { done: true };
        },
    },
];

function extractCommand(command) {
    let match = command.match(commandRegex);
    if (!match) {
        return null;
    }
    if (match[1] === "note") {
        return command;
    }
    return match[0];
}


async function processCommand(command, handler) {
    let match = command.match(commandRegex);
    if (!match) {
        return 'Error: No command was found. Make sure it is on it\'s own line and starts with "> "';
    }
    let cmd = match[1];
    let args = match[2];
    let commandObj = commands.find(c => c.name === cmd) || commands.find(c => c.aliases?.includes(cmd));
    if (!commandObj) {
        return `Error: Command "${cmd}" not found. Run "help" to see the list of commands.`;
    }
    return await commandObj.exec(args, handler);
}

export {
    processCommand,
    extractCommand,
    commands,
}