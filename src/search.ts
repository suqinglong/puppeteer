import puppeteer from 'puppeteer';
import { ChromeSettings } from './settings';
import { Config } from './tools/index';
import { SearchSite } from './sites/searchSite';
import { SiteManager } from './sites/siteManager';

export class Search implements ISearchClass {
    // create browser for one user, this browser will be found by endpoint stored in redis.
    public async createBrowser(task: ITASK): Promise<IbrowserWSEndpoint> {
        const browser = await puppeteer.launch({
            ...(Config.isUseChrome ? ChromeSettings : {}),
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--disable-gpu',
                '–disable-dev-shm-usage',
                '–disable-setuid-sandbox',
                '–no-first-run',
                '–no-sandbox',
                '–no-zygote',
                '–single-process',
                '--user-data-dir=/home/ubuntu/puppeteer/chrome-user-data'
            ],
            defaultViewport: {
                deviceScaleFactor: 1,
                width: 2200,
                height: 1080
            },
            dumpio: false
        });
        return browser.wsEndpoint();
    }

    // do task
    // 1.  go search page
    // 1.1 charge if need to login
    // 1.2 if need login and not loged, do login
    // 1.3 search and get result
    public async doTask(task: ITASK, browserWSEndpoint: IbrowserWSEndpoint) {
        console.log('Search doTask');
        const browser = await puppeteer.connect({ browserWSEndpoint });
        const SiteClass = SiteManager.getSite(task.site);
        const site = new SiteClass(browser) as SearchSite;
        await site.doSearch(task);
    }
}
