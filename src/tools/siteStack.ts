import puppeteer from 'puppeteer';
import { userAgent, viewPort } from '../settings';
import { Log } from './log';
import { SiteError } from '../error';

export class SiteStack {
    private stack: Array<DetailPage> = [];
    private stackDeep = 5;
    private detailPages: Array<DetailPage> = [];
    private callback: Function;
    private results = [];
    private searchCount: number;
    private resolve: Function;

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

    public async search() {
        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    public pushResult(result: IResultHTMLData) {
        this.results.push(result);
    }

    public async remove(page: DetailPage) {
        this.stack.splice(this.stack.indexOf(page), 1);
        await this.callback(this.results);
        this.searchCount--;
        console.log('SiteStack await callback end', this.searchCount);
        if (this.searchCount === 0) {
            console.log('SiteStack await callback resolve');
            this.resolve();
        } else {
            this.results = [];
            this.push();
        }
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
    protected log: Log;
    protected debugPre: string;
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
        this.log = new Log(this.debugPre + ':' + this.searchPage);
        await this.beforeSearch();
        const result = await this.search();
        await this.searchEnd({ ...result, ...this.originalData });
    }

    protected generateError(type: IErrorType, msg: string) {
        return new SiteError(type, `${this.debugPre}: ${msg}`);
    }

    private async searchEnd(result: IResultHTMLData) {
        this.siteStack.pushResult(result);
        await this.siteStack.remove(this);
        await this.page.close();
    }

    private async beforeSearch() {
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.searchPage, { timeout: 20000 });
    }

    protected abstract async search(): Promise<any>;
}
