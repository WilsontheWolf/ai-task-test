import RequestHandler from "./RequestHandler.js";

const task = 'What noise does a duck make?';

const handler = new RequestHandler(task);

handler.doRequest();