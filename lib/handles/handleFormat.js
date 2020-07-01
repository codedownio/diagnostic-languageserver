"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDocument = void 0;
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var vscode_languageserver_1 = require("vscode-languageserver");
var vscode_uri_1 = require("vscode-uri");
var util_1 = require("../common/util");
var hunkStream_1 = tslib_1.__importDefault(require("../common/hunkStream"));
function handleFormat(config, textDocument, text, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var command, _a, rootPatterns, isStdout, isStderr, _b, args, workDir, cmd, _c, _d, stdout, _e, stderr, code, output;
        return tslib_1.__generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    command = config.command, _a = config.rootPatterns, rootPatterns = _a === void 0 ? [] : _a, isStdout = config.isStdout, isStderr = config.isStderr, _b = config.args, args = _b === void 0 ? [] : _b;
                    return [4 /*yield*/, util_1.findWorkDirectory(vscode_uri_1.URI.parse(textDocument.uri).fsPath, rootPatterns)];
                case 1:
                    workDir = _f.sent();
                    if (config.requiredFiles && config.requiredFiles.length) {
                        if (!util_1.checkAnyFileExists(workDir, config.requiredFiles)) {
                            return [2 /*return*/, next(text)];
                        }
                    }
                    return [4 /*yield*/, util_1.findCommand(command, workDir)];
                case 2:
                    cmd = _f.sent();
                    return [4 /*yield*/, util_1.executeFile(new hunkStream_1.default(text), textDocument, cmd, args, {
                            cwd: workDir
                        })];
                case 3:
                    _c = _f.sent(), _d = _c.stdout, stdout = _d === void 0 ? '' : _d, _e = _c.stderr, stderr = _e === void 0 ? '' : _e, code = _c.code;
                    output = '';
                    if (code > 0) {
                        output = text;
                    }
                    else if (config.doesWriteToFile) {
                        output = fs_1.default.readFileSync(vscode_uri_1.URI.parse(textDocument.uri).fsPath, 'utf8');
                    }
                    else if (isStdout === undefined && isStderr === undefined) {
                        output = stdout;
                    }
                    else {
                        if (isStdout) {
                            output += stdout;
                        }
                        if (isStderr) {
                            output += stderr;
                        }
                    }
                    return [2 /*return*/, next(output)];
            }
        });
    });
}
function formatDocument(formatterConfigs, textDocument, token) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var resolve, text;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resolve = formatterConfigs
                        .reverse()
                        .reduce(function (res, config) {
                        return function (text) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                if (token.isCancellationRequested) {
                                    return [2 /*return*/];
                                }
                                return [2 /*return*/, handleFormat(config, textDocument, text, res)];
                            });
                        }); };
                    }, function (text) { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
                        return [2 /*return*/, text];
                    }); }); });
                    return [4 /*yield*/, resolve(textDocument.getText())];
                case 1:
                    text = _a.sent();
                    if (!text) {
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, [{
                                range: vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(0, 0), vscode_languageserver_1.Position.create(textDocument.lineCount + 1, 0)),
                                newText: text
                            }]];
            }
        });
    });
}
exports.formatDocument = formatDocument;
