"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsubscribe = exports.next = void 0;
var tslib_1 = require("tslib");
var vscode_languageserver_1 = require("vscode-languageserver");
var vscode_uri_1 = require("vscode-uri");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var path_1 = require("path");
var observable_1 = require("../common/observable");
var util_1 = require("../common/util");
var hunkStream_1 = tslib_1.__importDefault(require("../common/hunkStream"));
var logger_1 = tslib_1.__importDefault(require("../common/logger"));
var get_1 = tslib_1.__importDefault(require("lodash/get"));
var securityMap = {
    'error': vscode_languageserver_1.DiagnosticSeverity.Error,
    'warning': vscode_languageserver_1.DiagnosticSeverity.Warning,
    'info': vscode_languageserver_1.DiagnosticSeverity.Information,
    'hint': vscode_languageserver_1.DiagnosticSeverity.Hint
};
var origin$ = new rxjs_1.Subject();
var subscriptions = {};
function sumNum(num) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (num === undefined) {
        return 0;
    }
    return args.reduce(function (res, next) { return res + next; }, Number(num));
}
function formatMessage(message, match) {
    return [].concat(message).reduce(function (res, next) {
        if (typeof next === 'number') {
            res += match[next];
        }
        else {
            res += next;
        }
        return res;
    }, '');
}
function getSecurity(securityKey) {
    var security = securityMap[securityKey];
    return security !== undefined ? security : 1;
}
function handleLinterRegex(currentSourceName, output, config) {
    var _a = config.formatLines, formatLines = _a === void 0 ? 1 : _a, formatPattern = config.formatPattern;
    var linterResults = [];
    if (!formatLines || !formatPattern) {
        throw new Error('missing formatLines or formatPattern');
    }
    var _b = formatPattern[1], sourceName = _b.sourceName, line = _b.line, column = _b.column, endLine = _b.endLine, endColumn = _b.endColumn, message = _b.message, security = _b.security;
    var lines = output.split('\n');
    var str = lines.shift();
    while (lines.length > 0 || str !== undefined) {
        str = [str].concat(lines.slice(0, formatLines - 1)).join('\n');
        var m = str.match(new RegExp(formatPattern[0]));
        logger_1.default.log("match string: " + str);
        logger_1.default.log("match result: " + JSON.stringify(m, null, 2));
        if (m) {
            linterResults.push({
                sourceName: sourceName ? m[sourceName] : currentSourceName,
                security: m[security],
                line: m[line],
                column: m[column],
                endLine: endLine != undefined ? m[endLine] : undefined,
                endColumn: endColumn != undefined ? m[endColumn] : undefined,
                message: formatMessage(message, m),
            });
        }
        str = lines.shift();
    }
    return linterResults;
}
var variableFinder = /\$\{[^}]+}/g;
function formatStringWithObject(str, obj) {
    return str.replace(variableFinder, function (k) {
        // Remove `${` and `}`
        var lookup = k.slice(2, -1).trim();
        return get_1.default(obj, lookup, '');
    });
}
function handleLinterJson(currentSourceName, output, config) {
    if (!config.parseJson) {
        throw new Error('missing parseJson');
    }
    var _a = config.parseJson, sourceName = _a.sourceName, errorsRoot = _a.errorsRoot, line = _a.line, column = _a.column, endLine = _a.endLine, endColumn = _a.endColumn, security = _a.security, message = _a.message;
    var resultsFromJson = errorsRoot
        ? get_1.default(JSON.parse(output), errorsRoot, [])
        : JSON.parse(output);
    return resultsFromJson.map(function (jsonObject) {
        return {
            sourceName: sourceName ? get_1.default(jsonObject, sourceName) : currentSourceName,
            security: get_1.default(jsonObject, security),
            line: get_1.default(jsonObject, line),
            column: get_1.default(jsonObject, column),
            endLine: endLine ? get_1.default(jsonObject, endLine) : undefined,
            endColumn: endColumn ? get_1.default(jsonObject, endColumn) : undefined,
            message: formatStringWithObject(message, jsonObject),
        };
    });
}
function handleLinter(textDocument, config) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var command, _a, rootPatterns, _b, args, _c, offsetLine, _d, offsetColumn, sourceName, isStdout, isStderr, _e, securities, diagnostics, currentFile_1, workDir_1, cmd, output, _f, _g, stdout, _h, stderr, linterResults, lengthBefore, error_1;
        return tslib_1.__generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    command = config.command, _a = config.rootPatterns, rootPatterns = _a === void 0 ? [] : _a, _b = config.args, args = _b === void 0 ? [] : _b, _c = config.offsetLine, offsetLine = _c === void 0 ? 0 : _c, _d = config.offsetColumn, offsetColumn = _d === void 0 ? 0 : _d, sourceName = config.sourceName, isStdout = config.isStdout, isStderr = config.isStderr, _e = config.securities, securities = _e === void 0 ? {} : _e;
                    diagnostics = [];
                    // verify params
                    if (!command || !sourceName) {
                        logger_1.default.error("[" + textDocument.languageId + "] missing config");
                        return [2 /*return*/, diagnostics];
                    }
                    // Validate when sourceNameFilter is given that sourceName is also given.
                    if (config.formatPattern && (!config.formatPattern[1].sourceName && config.formatPattern[1].sourceNameFilter)) {
                        logger_1.default.error("[" + textDocument.languageId + "] formatPattern.sourceNameFilter can only be used when formatPattern.sourceName is defined");
                        return [2 /*return*/, diagnostics];
                    }
                    else if (config.parseJson && (!config.parseJson.sourceName && config.parseJson.sourceNameFilter)) {
                        logger_1.default.error("[" + textDocument.languageId + "] parseJson.sourceNameFilter can only be used when parseJson.sourceName is defined");
                        return [2 /*return*/, diagnostics];
                    }
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 5, , 6]);
                    currentFile_1 = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
                    return [4 /*yield*/, util_1.findWorkDirectory(currentFile_1, rootPatterns)];
                case 2:
                    workDir_1 = _j.sent();
                    logger_1.default.info("found working directory " + workDir_1);
                    if (config.requiredFiles && config.requiredFiles.length) {
                        if (!util_1.checkAnyFileExists(workDir_1, config.requiredFiles)) {
                            return [2 /*return*/, diagnostics];
                        }
                    }
                    return [4 /*yield*/, util_1.findCommand(command, workDir_1)];
                case 3:
                    cmd = _j.sent();
                    output = '';
                    return [4 /*yield*/, util_1.executeFile(new hunkStream_1.default(textDocument.getText()), textDocument, cmd, args, {
                            cwd: workDir_1
                        })];
                case 4:
                    _f = _j.sent(), _g = _f.stdout, stdout = _g === void 0 ? '' : _g, _h = _f.stderr, stderr = _h === void 0 ? '' : _h;
                    logger_1.default.log("Linter command: " + cmd + ", args: " + JSON.stringify(args));
                    logger_1.default.log("stdout: " + stdout);
                    logger_1.default.log("stderr: " + stderr);
                    if (isStdout == undefined && isStderr === undefined) {
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
                    linterResults = config.parseJson
                        ? handleLinterJson(sourceName, output, config)
                        : handleLinterRegex(sourceName, output, config);
                    // Check if we should filter based on the sourceName.
                    if ((config.parseJson && config.parseJson.sourceNameFilter)
                        || config.formatPattern && config.formatPattern[1].sourceNameFilter) {
                        lengthBefore = linterResults.length;
                        // Only use results that belong to the current file.
                        linterResults = linterResults.filter(function (x) {
                            // Check if the linter returned an absolute or relative path.
                            return path_1.isAbsolute(x.sourceName)
                                ? currentFile_1 === x.sourceName
                                : currentFile_1 === path_1.join(workDir_1, x.sourceName);
                        });
                        logger_1.default.log("Linting results after filtering: " + linterResults.length + " (before: " + lengthBefore + ")");
                    }
                    return [2 /*return*/, linterResults.map(function (linterResult) {
                            var line = linterResult.line, column = linterResult.column, endLine = linterResult.endLine, endColumn = linterResult.endColumn;
                            if (line !== undefined && column === undefined &&
                                endLine === undefined && endColumn === undefined) {
                                column = 1;
                                endLine = Number(line) + 1;
                                endColumn = 1;
                            }
                            else {
                                endLine = linterResult.endLine != undefined
                                    ? linterResult.endLine
                                    : linterResult.line;
                                endColumn = linterResult.endColumn != undefined
                                    ? linterResult.endColumn
                                    : linterResult.column;
                            }
                            return {
                                severity: getSecurity(securities[linterResult.security]),
                                range: {
                                    start: {
                                        // line and character is base zero so need -1
                                        line: sumNum(line, -1, offsetLine),
                                        character: sumNum(column, -1, offsetColumn)
                                    },
                                    end: {
                                        line: sumNum(endLine, -1, offsetLine),
                                        character: sumNum(endColumn, -1, offsetColumn)
                                    }
                                },
                                message: linterResult.message,
                                source: linterResult.sourceName,
                            };
                        })];
                case 5:
                    error_1 = _j.sent();
                    logger_1.default.error("[" + textDocument.languageId + "] diagnostic handle fail: [" + sourceName + "] " + error_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, diagnostics];
            }
        });
    });
}
function handleDiagnostics(textDocument, configs) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var diagnostics, _i, configs_1, linter, dias;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    diagnostics = [];
                    _i = 0, configs_1 = configs;
                    _a.label = 1;
                case 1:
                    if (!(_i < configs_1.length)) return [3 /*break*/, 4];
                    linter = configs_1[_i];
                    return [4 /*yield*/, handleLinter(textDocument, linter)];
                case 2:
                    dias = _a.sent();
                    diagnostics = diagnostics.concat(dias);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, {
                        uri: textDocument.uri,
                        diagnostics: diagnostics
                    }];
            }
        });
    });
}
function next(textDocument, connection, configs) {
    var uri = textDocument.uri;
    if (!subscriptions[uri]) {
        var debounce_1 = Math.max.apply(Math, tslib_1.__spreadArrays(configs.map(function (i) { return i.debounce; }), [100]));
        subscriptions[uri] = origin$.pipe(operators_1.filter(function (textDocument) { return textDocument.uri === uri; }), operators_1.switchMap(function (textDocument) {
            return rxjs_1.timer(debounce_1).pipe(operators_1.map(function () { return textDocument; }));
        }), observable_1.waitMap(function (textDocument) {
            return rxjs_1.from(handleDiagnostics(textDocument, configs));
        })).subscribe(function (diagnostics) {
            connection.sendDiagnostics(diagnostics);
        }, function (error) {
            logger_1.default.error("[" + textDocument.languageId + "]: observable error: " + error.message);
        });
    }
    origin$.next(textDocument);
}
exports.next = next;
function unsubscribe(textDocument) {
    var uri = textDocument.uri;
    var subp = subscriptions[uri];
    if (subp && !subp.closed) {
        subp.unsubscribe();
    }
    subscriptions[uri] = undefined;
}
exports.unsubscribe = unsubscribe;
