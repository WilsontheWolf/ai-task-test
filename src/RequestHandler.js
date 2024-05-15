import ansi from "./ANSI.js";
import { commands, extractCommand, processCommand } from "./commandHandler.js";

const url = 'http://10.0.0.169:11434/api/chat';
const model = 'llama3';

function makePrompt(task) {
    return `You must complete a task for a user. To do so, you must run commands in a bash-esque command prompt. 
You may only run one command at a time. To run a command just type "> " followed the command and it's arguments. The system will show you the response.
Once you have the info you need, then run send with the message to send to the user.
DO NOT run the same command over and over again.
If the command has newlines, make sure to put a \ before each line.
Here are the commands you may run:
Args wrapped in [] are optional.
${commands.map(command => `${command.name} ${command.usage ? `${command.usage}` : ''} - ${command.description}`).join('\n')}

Below is the user's message. You must try to answer it to the best of your ability. Make sure commands are on their own line, and have "> " before them.
Message: ${task}`
};

class RequestHandler {
    constructor(task) {
        this.task = task;
        this.history = [{ role: "system", content: makePrompt(task) }]
        this.sent = false;
        this.runs = 0
        this.alreadySent = false;
    }

    async doRequest(command) {
        if (this.runs > 20) {
            return;
        }
        this.runs++;
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: this.history,
                model,
                stream: false,
            }),
        }).catch(err => console.error(err));

        if (!response) {
            return;
        }
        if (!response.ok) {
            console.error(response.statusText);
            return;
        }
        let json = await response.json();
        let msg = json.message;
        if (!msg) {
            console.error('No message in response');
            return;
        }
        this.history.push(msg);
        console.log(ansi.RED(msg.content));
        msg.content = extractCommand(msg.content) ?? msg.content;
        ansi.printMessage(msg);

        let resp = processCommand(msg.content, this);
        if (resp.done) {
            return;
        }
        this.history.push({ role: "user", content: resp });
        ansi.printMessage(this.history[this.history.length - 1]);
        this.doRequest();
    }
}

export default RequestHandler;