import ansi from "./ANSI.js";
import RequestHandler from "./RequestHandler.js";

const request = 'What day was it yesterday?';

async function callbackHandler(data) {
    switch (data?.type) {
        case 'message':
            console.log(ansi.YELLOW(data.content));
            break;
        case 'username':
            return "WilsontheWolf";
        case 'userinfo':
            return "Name: WilsontheWolf\nBio: https://shorty.systems/\nMatrix: @shorty:shorty.systems\nI very much dislike how my username is lowercase"
        case 'done':
            console.log(ansi.RED("\nFinal Info:"))
            data.history.forEach(ansi.printMessage);
            break;
        case 'askYN':
            console.log(ansi.PURPLE(data.content));
            return new Promise((resolve, reject) => {
                process.stdin.once('data', (chunk) => {
                    let res = chunk.toString().trim();
                    if (res === 'yes' || res === 'no') {
                        resolve(res);
                    } else {
                        console.log(ansi.RED('Invalid response. Please respond with "yes" or "no".'));
                        reject("The user didn't provide a valid response.");
                    }
                });
            });
        default:
            console.error('Unknown data type:', data);
            break;
    }
}

const handler = new RequestHandler(request, callbackHandler);

await handler.doRequest();

process.exit();