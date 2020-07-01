export declare type SecurityKey = 'error' | 'warning' | 'info' | 'hint';
export interface ISecurities {
    [key: string]: SecurityKey;
}
export interface ILinterConfig {
    command: string;
    rootPatterns: string[] | string;
    isStdout?: boolean;
    isStderr?: boolean;
    debounce?: number;
    args?: Array<string | number>;
    sourceName: string;
    formatLines?: number;
    formatPattern: [string, {
        line: number;
        column: number;
        endLine?: number;
        endColumn?: number;
        message: Array<number | string> | number;
        security: number;
    }];
    securities?: ISecurities;
    offsetLine?: number;
    offsetColumn?: number;
    requiredFiles?: string[];
    parseJson?: {
        errorsRoot?: string | string[];
        line: string;
        column: string;
        endLine?: string;
        endColumn?: string;
        message: string;
        security: string;
    };
}
export interface ILinterResult {
    security: string;
    line: string | number;
    column: string | number;
    endLine?: string | number;
    endColumn?: string | number;
    message: string;
}
export interface IFormatterConfig {
    command: string;
    args?: Array<string | number>;
    rootPatterns?: string[] | string;
    isStdout?: boolean;
    isStderr?: boolean;
    doesWriteToFile?: boolean;
    requiredFiles?: string[];
}
export interface IConfig {
    linters: {
        [linter: string]: ILinterConfig;
    };
    filetypes: {
        [fileType: string]: string | string[];
    };
    formatters: {
        [formatter: string]: IFormatterConfig;
    };
    formatFiletypes: {
        [fileType: string]: string | string[];
    };
}