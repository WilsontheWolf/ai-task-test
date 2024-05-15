import ansi from "./ANSI.js";

const commandRegex = /^> (\w+)(?: ([^\n]+))?/m;

const commands = [
    {
        name: 'help',
        description: 'Shows additional help about commands',
        usage: '[command]',
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
        name: 'task',
        description: 'Repeats the task that you must complete.',
        usage: '',
        exec: function (args, task) {
            return task;
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
        exec: function (args) {
            console.log(ansi.YELLOW(args));
            return 'Message sent.'
        },
    },
    {
        name: 'userinfo',
        description: 'Shows information about the user.',
        usage: '',
        exec: function () {
            return 'Error: Not implemented.'
        },
    },
    {
        name: 'done',
        description: 'Finishes the exchange.',
        usage: '',
        exec: function () {
            return { done: true };
        },
    },
];

function extractCommand(command) {
    let match = command.match(commandRegex);
    if (!match) {
        return null;
    }
    return match[0];
}


function processCommand(command, task) {
    let match = command.match(commandRegex);
    if (!match) {
        return 'Error: No command was found. Make sure it is on it\'s own line and starts with "> "';
    }
    let cmd = match[1];
    let args = match[2];
    let commandObj = commands.find(c => c.name === cmd);
    if (!commandObj) {
        return `Error: Command "${cmd}" not found. Run "help" to see the list of commands.`;
    }
    return commandObj.exec(args, task);
}

export {
    processCommand,
    extractCommand,
    commands,
}