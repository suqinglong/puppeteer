import puppeteer from 'puppeteer';
import { PowerDatComSite } from './sites/power.dat.com';
import { EchodriveEchoCom } from './sites/echodrive.echo.com';
import { Settings } from './settings';
import { getMode } from './tools/index';
import { SearchSite } from './sites/search.site';

const sitesMap = {
    'Echo Driver': EchodriveEchoCom,
    DAT: PowerDatComSite
};

export class Search implements ISearchClass {
    private mode: IMode = getMode();
    private settings = this.mode === 'develop' ? Settings : {};

    public async createBrowser(): Promise<IbrowserWSEndpoint> {
        const browser = await puppeteer.launch({
            ...this.settings,
            args: ['no-sandbox', 'disable-setuid-sandbox']
        });
        return browser.wsEndpoint();
    }

    public async doTask(task: ITASK, browserWSEndpoint: IbrowserWSEndpoint) {
        const browser = await puppeteer.connect({ browserWSEndpoint });
        const SiteClass = sitesMap[task.site];
        const site = this.createSite(SiteClass, browser);
        await site.prepare(task.email, task.password); // new page and login
        await site.search(task);
        await site.closePage();
    }

    private createSite(
        SiteClass: new (browser: puppeteer.Browser) => SearchSite,
        browser: puppeteer.Browser
    ): SearchSite {
        return new SiteClass(browser);
    }
}
