import ansi from "./ANSI.js";
import RequestHandler from "./RequestHandler.js";

const task = 'What day of the week was it yesterday?';

const handler = new RequestHandler(task);

ansi.printMessage(handler.history[0]);
handler.doRequest();