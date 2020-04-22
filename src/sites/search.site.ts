import puppeteer from 'puppeteer';
export abstract class SearchSite implements ISite {
    protected browser: puppeteer.Browser;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public abstract async prePare()

    public abstract async search(task: ITASK)
    
}
