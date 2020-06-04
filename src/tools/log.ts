import colors from 'colors';

export class Log {
    private preStr: string;
    public constructor(preStr: string) {
        this.preStr = preStr;
    }
    public log(...msg: any[]) {
        console.log(`${this.preStr}:`, ...msg);
    }

    public error(...msg: any[]) {
        console.log(`${this.preStr}:`, ...msg.map((item) => colors.red(item)));
    }

    public warning(...msg: any[]) {
        console.log(`${this.preStr}:`, ...msg.map((item) => colors.yellow(item)));
    }
}
