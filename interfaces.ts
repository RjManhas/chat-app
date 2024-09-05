import exp from "constants";

interface MessageRequestBody {
    message: string;
    username: string;
}

interface HistoryMessage {
    message: string;
    username: string;
    date: string;
    endpoint: string;
    room?: string;
}

export { MessageRequestBody, HistoryMessage }