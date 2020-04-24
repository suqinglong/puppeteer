import puppeteer from 'puppeteer';
import { PowerDatComSite } from './sites/power.dat.com';
import { EchodriveEchoCom } from './sites/echodrive.echo.com';
import { Settings } from './settings';
import { getMode } from './tools/index';

const sitesMap = {
    'Echo Driver': EchodriveEchoCom,
    DAT: PowerDatComSite
};

export class Search implements ISearchClass {
    private mode: IMode = getMode();
    private settings = this.mode === 'develop' ? Settings : {};

    public async createBrowser(task: ITASK): Promise<IbrowserWSEndpoint> {
        const browser = await puppeteer.launch(
            {
                ...this.settings,
                ignoreDefaultArgs: ["--enable-automation"],
                args: ['no-sandbox', 'disable-setuid-sandbox'],
                defaultViewport: {
                    width: 1920,
                    height: 1080,
                }
            });
        const SiteClass = sitesMap[task.site];
        const site = new SiteClass(browser);
        await site.prepare(task.email, task.password); // new page and login
        await site.closePage();
        return browser.wsEndpoint();
    }

    public async doTask(task: ITASK, browserWSEndpoint: IbrowserWSEndpoint) {
        console.log('Search browserWSEndpoint', browserWSEndpoint)
        const browser = await puppeteer.connect({ browserWSEndpoint });
        const SiteClass = sitesMap[task.site];
        const site = new SiteClass(browser);
        await site.search(task);
        await site.closePage();
    }
}
