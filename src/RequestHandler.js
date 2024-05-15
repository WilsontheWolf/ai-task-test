import ansi from "./ANSI.js";
import { commands, extractCommand, processCommand } from "./commandHandler.js";

const url = 'http://10.0.0.169:11434/api/chat';
const model = 'llama3';

function makePrompt(task) {
    return `You must complete a task for a user. To do so, you must run commands in a bash-esque command prompt. 
You may only run one command at a time. To run a command just type "> " followed the command and it's arguments. The system will show you the response.
Once you have the info you need, then run send with the message to send to the user.
When you are done all your actions, then run done.
DO NOT run the same command over and over again.
Do not apologize for any mistakes you make.
Here are the commands you may run:
Args wrapped in [] are optional.
${commands.map(command => `${command.name} ${command.usage ? `${command.usage}` : ''} - ${command.description}`).join('\n')}

Below is your task. You must try to answer it to the best of your ability. You may use any of the commands to fulfill your task. Only do one thing at a time. Make sure commands are on their own line, and have "> " before them.
Task: ${task}`
};

class RequestHandler {
    constructor(task) {
        this.task = task;
        this.history = [{ role: "system", content: makePrompt(task) }]
        this.sent = false;
        this.runs = 0
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
        msg.content = extractCommand(msg.content) ?? msg.content;
        console.log(ansi.GREEN(msg.content));

        let resp = processCommand(msg.content, this.task);
        if (resp.done) {
            return;
        }
        this.history.push({ role: "user", content: resp });
        console.log(ansi.BLUE(resp));
        this.doRequest();
    }
}

export default RequestHandler;