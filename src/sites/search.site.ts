import puppeteer from 'puppeteer';
export abstract class SearchSite implements ISite {
    public siteName: string;
    public isLogin: boolean;

    protected browser: puppeteer.Browser;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    protected async sleep(num: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, num);
        });
    }

    public abstract async prepare(email: string, password: string);

    public abstract async search(task: ITASK);

    public abstract async closePage();

}
