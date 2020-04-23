import puppeteer from 'puppeteer';
import { PowerDatComSite } from './sites/power.dat.com';
import { EchodriveEchoCom } from './sites/echodrive.echo.com';
import { Settings } from './settings';
import { getMode } from './tools/index';
import { SearchSite } from './sites/search.site';

const sites = [EchodriveEchoCom, PowerDatComSite];

export class Search implements ISearchClass {
    private mode: IMode = getMode();
    private settings = this.mode === 'develop' ? Settings : {};
    private searchSites: { [key: string]: SearchSite } = {};

    public async prepare() {
        const browser = await puppeteer.launch({
            ...this.settings,
            args: ['no-sandbox', 'disable-setuid-sandbox']
        });
        await this.parepareSites(browser, sites);
    }

    public async doTask(task: ITASK) {
        const matchedSite = this.searchSites[task.site];
        if (!matchedSite) {
            return;
        }
        if (!matchedSite.isLogin) {
            await matchedSite.prePare(task.email, task.password);
        }
        await matchedSite.search(task);
    }

    private async parepareSites(
        browser: puppeteer.Browser,
        SiteClasses: Array<new (browser: puppeteer.Browser) => SearchSite>
    ) {
        SiteClasses.forEach(async (SiteClass) => {
            const site = new SiteClass(browser);
            this.searchSites[site.siteName] = site;
        });
    }
}
