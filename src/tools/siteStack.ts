import puppeteer from 'puppeteer';
import { userAgent, viewPort } from '../settings';

export class SiteStack {
    private stack: Array<DetailPage> = [];
    private stackDeep = 5;
    private detailPages: Array<DetailPage> = [];
    private callback: Function;
    private results = [];
    private searchCount: number;

    public constructor(
        detailPages: Array<DetailPage>,
        stackDeep: number,
        callback: (result: Array<IResultHTMLData>, isEnd: boolean) => void
    ) {
        this.detailPages = detailPages;
        this.stackDeep = stackDeep;
        this.callback = callback;
        this.searchCount = detailPages.length;
        this.push();
    }

    public pushResult(result: IResultHTMLData) {
        this.results.push(result);
    }

    public remove(page: DetailPage) {
        this.stack.splice(this.stack.indexOf(page), 1);
        this.searchCount--;
        this.callback(this.results, this.searchCount === 0);
        this.results = [];
        this.push();
    }

    private push() {
        while (this.stack.length < this.stackDeep && this.detailPages.length > 0) {
            const newPage = this.detailPages.shift();
            newPage.setSiteStack(this);
            this.stack.push(newPage);
            newPage.doSearch();
        }
    }
}

export abstract class DetailPage {
    protected page: puppeteer.Page;
    protected searchPage: string;
    private siteStack: SiteStack;
    private browser: puppeteer.Browser;
    private originalData = {};

    public constructor(searchPage: string, browser: puppeteer.Browser, originalData: Object) {
        this.searchPage = searchPage;
        this.browser = browser;
        this.originalData = originalData;
    }

    public setSiteStack(siteStack: SiteStack) {
        this.siteStack = siteStack;
    }

    public getOriginalData() {
        return this.originalData;
    }

    public async doSearch() {
        await this.searchPrepare();
        const result = await this.search()
        this.searchEnd({ ...result, ...this.originalData });
    }

    private async searchEnd(result: IResultHTMLData) {
        this.siteStack.pushResult(result);
        this.siteStack.remove(this);
        await this.page.close();
    }

    private async searchPrepare() {
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.searchPage, { timeout: 20000 });
    }

    protected abstract async search(): Promise<IResultHTMLData>;
}
