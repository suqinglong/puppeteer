import puppeteer from 'puppeteer';
import { Settings } from './settings';
import { getMode, useDev } from './tools/index';
import { SingletonTedis } from './tools/tedis';
import { SearchSite } from './sites/searchSite';
import { SiteManager } from './sites/siteManager';

export class Search implements ISearchClass {
    private mode: IMode = getMode();
    private settings = this.mode === 'develop' ? (useDev() === 'yes' ? Settings : {}) : {};

    public async createBrowser(task: ITASK): Promise<IbrowserWSEndpoint> {
        const browser = await puppeteer.launch({
            ...this.settings,
            ignoreDefaultArgs: ['--enable-automation'],
            // args: ['no-sandbox', 'disable-setuid-sandbox'],
            defaultViewport: {
                deviceScaleFactor: 2,
                width: 1920,
                height: 1080
            }
        });
        const SiteClass = SiteManager.getSite(task.site);
        const site = new SiteClass(browser) as SearchSite;
        await site.doLogin(task); // new page and login
        await site.closePage();
        return browser.wsEndpoint();
    }

    public async doTask(task: ITASK, browserWSEndpoint: IbrowserWSEndpoint) {
        console.log('Search doTask');
        const browser = await puppeteer.connect({ browserWSEndpoint });
        const SiteClass = SiteManager.getSite(task.site);
        const site = new SiteClass(browser) as SearchSite;
        if (await SingletonTedis.isUserLogoutSite(task.user_id, task.site)) {
            await site.doLogin(task);
        }
        await site.doSearch(task);
        await site.closePage();
    }
}
