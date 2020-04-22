import puppeteer from 'puppeteer';
export class SearchSite implements ISite {
    protected browser: puppeteer.Browser;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public async prePare() {}

    public async doTask() {}
}
