export class Log {
  private preStr:string
  public constructor(preStr:string) {
    this.preStr = preStr
  }
  public log(...msg) {
    console.log(`${this.preStr}:`, ...msg)
  }
}