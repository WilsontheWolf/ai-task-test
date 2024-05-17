import ansi from "./ANSI.js";
import RequestHandler from "./RequestHandler.js";

const request = 'What is my name?';

function callbackHandler(data) {
    switch (data?.type) {
        case 'message':
            console.log(ansi.YELLOW(data.content));
            break;
        case 'userinfo':
            return "Name: WilsontheWolf\nBio: https://shorty.systems/\nMatrix: @shorty:shorty.systems\nI very much dislike how my username is lowercase"
        case 'done':
            console.log(ansi.RED("\nFinal Info:"))
            data.history.forEach(ansi.printMessage);
            break;
        default:
            console.error('Unknown data type:', data);
            break;
    }
}

const handler = new RequestHandler(request, callbackHandler);

handler.doRequest();