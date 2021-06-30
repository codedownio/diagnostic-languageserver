"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var commander_1 = require("commander");
var vscode_languageserver_1 = require("vscode-languageserver");
var vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
var handleDiagnostic_1 = require("./handles/handleDiagnostic");
var logger_1 = tslib_1.__importDefault(require("./common/logger"));
var handleFormat_1 = require("./handles/handleFormat");
// parse command line options
var options = new commander_1.Command("diagnostic-languageserver")
    .version(require("../package.json").version)
    .option("--log-level <logLevel>", "A number indicating the log level (4 = log, 3 = info, 2 = warn, 1 = error). Defaults to `2`.")
    .option("--stdio", "use stdio")
    .option("--node-ipc", "use node-ipc")
    .option("--socket <port>", "use socket. example: --socket=5000")
    .allowUnknownOption(true)
    .parse(process.argv);
var logLevel = vscode_languageserver_1.MessageType.Warning;
if (options.logLevel) {
    logLevel = parseInt(options.logLevel, 10);
    if (logLevel && (logLevel < 1 || logLevel > 4)) {
        logger_1.default.error("Invalid `--log-level " + logLevel + "`. Falling back to `log` level.");
        logLevel = vscode_languageserver_1.MessageType.Log;
    }
}
// create connection by command argv
var connection = vscode_languageserver_1.createConnection();
// init logger
logger_1.default.init(connection, logLevel);
// sync text document manager
var documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// config of initializationOptions
var config;
// lsp initialize
connection.onInitialize(function (param) {
    var _a = param.initializationOptions, initializationOptions = _a === void 0 ? {} : _a;
    config = initializationOptions;
    return {
        capabilities: {
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental,
            documentFormattingProvider: true
        }
    };
});
var handleDiagnostic = function (change) {
    var textDocument = change.document;
    var _a = config.linters, linters = _a === void 0 ? {} : _a, _b = config.filetypes, filetypes = _b === void 0 ? {} : _b;
    if (!filetypes[textDocument.languageId]) {
        return;
    }
    var linter = [].concat(filetypes[textDocument.languageId]);
    var configItems = linter.map(function (l) { return linters[l]; }).filter(function (l) { return l; });
    if (configItems.length === 0) {
        return;
    }
    handleDiagnostic_1.next(textDocument, connection, configItems);
};
// document change or open
documents.onDidChangeContent(handleDiagnostic);
// document will save
documents.onDidSave(handleDiagnostic);
documents.onDidClose(function (evt) {
    handleDiagnostic_1.unsubscribe(evt.document);
});
// listen for document's open/close/change
documents.listen(connection);
// handle format request
connection.onDocumentFormatting(function (params, token) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var textDocument, doc, formatters, formatFiletypes, formatterNames, formatterConfigs;
    return tslib_1.__generator(this, function (_a) {
        textDocument = params.textDocument;
        if (!textDocument || !textDocument.uri) {
            return [2 /*return*/];
        }
        doc = documents.get(textDocument.uri);
        if (!doc) {
            return [2 /*return*/];
        }
        formatters = config.formatters, formatFiletypes = config.formatFiletypes;
        if (!formatFiletypes[doc.languageId]) {
            return [2 /*return*/];
        }
        formatterNames = [].concat(formatFiletypes[doc.languageId]);
        formatterConfigs = formatterNames.map(function (n) { return formatters[n]; }).filter(function (n) { return n; });
        if (formatterConfigs.length === 0) {
            return [2 /*return*/];
        }
        return [2 /*return*/, handleFormat_1.formatDocument(formatterConfigs, doc, token)];
    });
}); });
// lsp start
connection.listen();