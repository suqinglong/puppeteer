import puppeteer from 'puppeteer';
import { userAgent, viewPort } from '../settings';
import { Log } from './log';
import { SiteError } from '../error';
import { Config } from '../tools/index';
import { SearchSite } from '@/sites/searchSite';

export class SiteQueue {
    private queue: Array<DetailPage> = [];
    private queueLength = 5;
    private detailPages: Array<DetailPage> = [];
    private searchCount: number;
    private resolve: Function;

    public constructor(detailPages: Array<DetailPage>, queueLength: number) {
        this.detailPages = detailPages;
        this.queueLength = queueLength;
        this.searchCount = detailPages.length;
    }

    public async search() {
        this.pushDetailPages();
        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    public async remove(page: DetailPage) {
        this.queue.splice(this.queue.indexOf(page), 1);
        this.searchCount--;
        if (this.searchCount === 0) {
            this.resolve();
        } else {
            this.pushDetailPages();
        }
    }

    private pushDetailPages() {
        while (this.queue.length < this.queueLength && this.detailPages.length > 0) {
            const newPage = this.detailPages.shift();
            newPage.setSiteQueue(this);
            this.queue.push(newPage);
            newPage.doSearch();
        }
    }
}

export abstract class DetailPage {
    protected page: puppeteer.Page;
    protected searchPage: string;
    protected log: Log;
    protected debugPre: string;
    protected searchSite: SearchSite;
    private task: ITASK;
    private siteQueue: SiteQueue;
    private browser: puppeteer.Browser;
    private originalData = {};

    public constructor(searchPage: string, originalData: Object) {
        this.searchPage = searchPage;
        this.originalData = originalData;
    }

    public prePare(browser: puppeteer.Browser, task: ITASK, searchSite: SearchSite) {
        this.browser = browser;
        this.task = task;
        this.searchSite = searchSite;
    }

    public setSiteQueue(siteQueue: SiteQueue) {
        this.siteQueue = siteQueue;
    }

    public getOriginalData() {
        return this.originalData;
    }

    public async doSearch() {
        try {
            this.log = new Log(this.debugPre + ':' + this.searchPage);
            this.page = await this.browser.newPage();
            await this.page.setViewport(viewPort);
            await this.page.setUserAgent(userAgent);
            await this.page.goto(this.searchPage, { timeout: 20000 });
            await this.search(this.task);
        } catch (e) {
            await this.screenshot('doSearch error');
            this.log.log('An error in doSearch', e);
        }
        await this.siteQueue.remove(this);
        await this.page.close();
    }

    protected generateError(type: IErrorType, msg: string) {
        return new SiteError(type, `${this.debugPre}: ${msg}`);
    }

    protected async screenshot(name: string) {
        if (Config.isUseScreenshot) {
            console.log(`screenshot: ${this.debugPre}-${name}.png`);
            await this.page.screenshot({
                path: `/home/ubuntu/screenshot/${
                    this.debugPre + ':' + this.searchPage
                }-${name}.png`,
                fullPage: true
            });
        }
    }

    protected abstract async search(task: ITASK): Promise<void>;
}
