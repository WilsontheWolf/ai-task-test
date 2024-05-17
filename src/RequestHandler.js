import ansi from "./ANSI.js";
import { commands, extractCommand, processCommand } from "./commandHandler.js";

const url = 'http://10.0.0.169:11434/api/chat';
const model = 'llama3';
const name = "Helperbot";

function makePrompt(request) {
    return `You must complete a request for a user. To do so, you must run commands in a command prompt. 
You may only run one command at a time. To run a command just type "> " followed the command and it's arguments. The system will show you the response.
Once you have the info you need, then run send with the message to send to the user.
DO NOT run the same command over and over again.

You must try to answer the request (found by running request) to the best of your ability. If the user's request is nonsensical or invalid, you must reply with a concise error.
Make sure commands are on their own line, and have "> " before them.`
};

class RequestHandler {
    constructor(request, callbackHandler) {
        this.request = request;
        this.history = [
            { role: "system", content: makePrompt(request) },
            { role: "assistant", content: "> help" },
            { role: "user", content: commands.find(c => c.name === "help").exec(undefined, this) },
            { role: "assistant", content: "> request" },
            { role: "user", content: commands.find(c => c.name === "request").exec(undefined, this) },
        ]
        this.sent = false;
        this.runs = 0
        this.alreadySent = false;
        this.doneRepeat = false;
        this.callbackHandler = callbackHandler;
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

        let resp = await processCommand(msg.content, this);
        if (resp?.done) {
            this.callbackHandler({ type: 'done', history: this.history, sent: this.alreadySent });
            return;
        }
        if (resp) {
            this.history.push({ role: "user", content: resp });
        }
        this.doRequest();
    }
}

export default RequestHandler;