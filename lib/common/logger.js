"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_languageserver_1 = require("vscode-languageserver");
var connection;
var level;
exports.default = {
    init: function (con, lev) {
        connection = con;
        level = lev;
    },
    error: function (message) {
        if (connection && level >= vscode_languageserver_1.MessageType.Error) {
            connection.console.error(message);
        }
    },
    warn: function (message) {
        if (connection && level >= vscode_languageserver_1.MessageType.Warning) {
            connection.console.warn(message);
        }
    },
    info: function (message) {
        if (connection && level >= vscode_languageserver_1.MessageType.Info) {
            connection.console.info(message);
        }
    },
    log: function (message) {
        if (connection && level >= vscode_languageserver_1.MessageType.Log) {
            connection.console.log(message);
        }
    },
};
