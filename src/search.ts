import puppeteer from 'puppeteer';
import { PowerDatComSite } from './sites/power.dat.com';
import { EchodriveEchoCom } from './sites/echodrive.echo.com';
import { Settings } from './settings';
import { getMode } from './tools/index';
import { SearchSite } from './sites/search.site';
import { SingletonTedis } from './tools/tedis';
import { Tedis } from 'tedis';

const sites = [EchodriveEchoCom, PowerDatComSite];

export class Search implements ISearchClass {
    private tedis: Tedis = new SingletonTedis().getInstance();
    private mode: IMode = getMode();
    private settings = this.mode === 'develop' ? Settings : {};
    private searchSites: { [key: string]: SearchSite } = {};

    public async prepare() {
        this.developPrepare();
        puppeteer
            .launch({
                ...this.settings,
                args: ['no-sandbox', 'disable-setuid-sandbox']
            })
            .then(async (browser: puppeteer.Browser) => {
                await this.parepareSites(browser, sites);
            });
    }

    public async doTask(task: ITASK) {
        const matchedSite = this.searchSites[task.site];
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

    private developPrepare() {
        if (this.mode === 'develop') {
            const taskResult = JSON.stringify({
                email: 'primelinkexpress@live.com',
                password: 'Gary1978',
                user_id: '3',
                task_id: 'ca7eb2b1c5c98467ae4809d95bdc5446',
                site: 'XPO Connect',
                criteria: {
                    origin: 'Simsboro, LA',
                    origin_radius: '100',
                    destination: 'Luray, VA',
                    destination_radius: '100',
                    pick_up_date: '2020-04-22',
                    equipment: 'Van'
                }
            });
            this.tedis.lpush('search_tasks', taskResult);
        }
    }
}
