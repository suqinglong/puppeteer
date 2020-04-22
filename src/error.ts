export class SiteError {
    public type: IErrorType;
    public msg: string;

    public constructor(type: IErrorType, msg: string) {
        this.type = type;
        this.msg = msg;

        console.log(this.type, this.msg);
    }
}
