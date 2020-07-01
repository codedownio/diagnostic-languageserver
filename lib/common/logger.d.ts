import { IConnection, MessageType } from 'vscode-languageserver';
declare const _default: {
    init: (con: IConnection, lev: MessageType) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    info: (message: string) => void;
    log: (message: string) => void;
};
export default _default;
