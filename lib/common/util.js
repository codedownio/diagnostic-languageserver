"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAnyFileExists = exports.findCommand = exports.findWorkDirectory = exports.spawnAsync = exports.executeFile = void 0;
var tslib_1 = require("tslib");
var vscode_uri_1 = require("vscode-uri");
var fs_1 = tslib_1.__importDefault(require("fs"));
var os_1 = tslib_1.__importDefault(require("os"));
var path_1 = tslib_1.__importDefault(require("path"));
var find_up_1 = tslib_1.__importDefault(require("find-up"));
var child_process_1 = require("child_process");
var tempy_1 = tslib_1.__importDefault(require("tempy"));
var del_1 = tslib_1.__importDefault(require("del"));
var logger_1 = tslib_1.__importDefault(require("./logger"));
function executeFile(input, textDocument, command, args, option) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var fpath, usePipe, tempFilename, result;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fpath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
                    usePipe = true;
                    return [4 /*yield*/, Promise.all((args || []).map(function (arg) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (/%text/.test(arg)) {
                                            usePipe = false;
                                            return [2 /*return*/, arg.replace(/%text/g, input.toString())];
                                        }
                                        if (/%filepath/.test(arg)) {
                                            return [2 /*return*/, arg.replace(/%filepath/g, fpath)];
                                        }
                                        if (/%relativepath/.test(arg) && option && option.cwd) {
                                            return [2 /*return*/, arg.replace(/%relativepath/g, path_1.default.relative(option.cwd, fpath))];
                                        }
                                        if (/%filename/.test(arg)) {
                                            return [2 /*return*/, arg.replace(/%filename/g, path_1.default.basename(fpath))];
                                        }
                                        if (/%dirname/.test(arg)) {
                                            return [2 /*return*/, arg.replace(/%dirname/g, path_1.default.dirname(fpath))];
                                        }
                                        if (/%file/.test(arg)) {
                                            usePipe = false;
                                            return [2 /*return*/, arg.replace(/%file/g, fpath)];
                                        }
                                        if (!/%tempfile/.test(arg)) return [3 /*break*/, 2];
                                        usePipe = false;
                                        return [4 /*yield*/, tempy_1.default.write(input, { extension: path_1.default.extname(fpath) })];
                                    case 1:
                                        tempFilename = _a.sent();
                                        return [2 /*return*/, arg.replace(/%tempfile/g, tempFilename)];
                                    case 2: return [2 /*return*/, arg];
                                }
                            });
                        }); }))];
                case 1:
                    args = _a.sent();
                    logger_1.default.log("linter run args: " + JSON.stringify(args));
                    return [4 /*yield*/, spawnAsync(command, args, tslib_1.__assign(tslib_1.__assign({}, option), { shell: os_1.default.platform() === 'win32' ? true : undefined, input: usePipe ? input : undefined }))];
                case 2:
                    result = _a.sent();
                    if (!(tempFilename != null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, del_1.default(tempFilename, { force: true })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, result];
            }
        });
    });
}
exports.executeFile = executeFile;
function spawnAsync(command, args, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var child = child_process_1.spawn(command, args, tslib_1.__assign(tslib_1.__assign({}, options), { shell: os_1.default.platform() === 'win32' ? true : undefined }));
                    var stdout = '';
                    var stderr = '';
                    var error;
                    child.stdout.on('data', function (data) {
                        stdout += data;
                    });
                    child.stderr.on('data', function (data) {
                        stderr += data;
                    });
                    child.on('error', function (err) {
                        error = err;
                        reject(error);
                    });
                    child.on('close', function (code) {
                        if (!error) {
                            resolve({ code: code, stdout: stdout, stderr: stderr });
                        }
                    });
                    // error will occur when cp get error
                    if (options.input) {
                        options.input.pipe(child.stdin).on('error', function () { });
                    }
                })];
        });
    });
}
exports.spawnAsync = spawnAsync;
// find work dirname by root patterns
function findWorkDirectory(filePath, rootPatterns) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var dirname, patterns, _loop_1, _i, patterns_1, pattern, state_1, err_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dirname = path_1.default.dirname(filePath);
                    patterns = [].concat(rootPatterns);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    _loop_1 = function (pattern) {
                        var dir;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, find_up_1.default(function (directory) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var hasMatch;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, find_up_1.default.exists(path_1.default.join(directory, pattern))];
                                                case 1:
                                                    hasMatch = _a.sent();
                                                    logger_1.default.log("searching working directory: " + directory + ", cwd: " + dirname + ", pattern: " + pattern + ", matches: " + hasMatch);
                                                    return [2 /*return*/, hasMatch && directory];
                                            }
                                        });
                                    }); }, { type: 'directory', cwd: dirname })];
                                case 1:
                                    dir = _a.sent();
                                    if (dir && dir !== "/") {
                                        return [2 /*return*/, { value: dir }];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, patterns_1 = patterns;
                    _a.label = 2;
                case 2:
                    if (!(_i < patterns_1.length)) return [3 /*break*/, 5];
                    pattern = patterns_1[_i];
                    return [5 /*yield**/, _loop_1(pattern)];
                case 3:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, dirname];
            }
        });
    });
}
exports.findWorkDirectory = findWorkDirectory;
function findCommand(command, workDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var cmd;
        return tslib_1.__generator(this, function (_a) {
            if (/^(\.\.|\.)/.test(command)) {
                cmd = path_1.default.join(workDir, command);
                if (fs_1.default.existsSync(cmd)) {
                    return [2 /*return*/, command];
                }
                return [2 /*return*/, path_1.default.basename(cmd)];
            }
            return [2 /*return*/, command];
        });
    });
}
exports.findCommand = findCommand;
function checkAnyFileExists(workDir, testPaths) {
    for (var _i = 0, testPaths_1 = testPaths; _i < testPaths_1.length; _i++) {
        var testPath = testPaths_1[_i];
        if (fs_1.default.existsSync(path_1.default.join(workDir, testPath))) {
            return true;
        }
    }
    return false;
}
exports.checkAnyFileExists = checkAnyFileExists;