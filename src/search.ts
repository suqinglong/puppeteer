import puppeteer from 'puppeteer';
import { PowerDataComSite } from './sites/power.dat.com';
import { EchodriveEchoCom } from './sites/echodrive.echo.com';
import { Settings } from './settings';
import { getMode } from './tools/index';
import { SearchSite } from './sites/search.site';
import { Singleton } from './tools/tedis';
import { Tedis } from 'tedis';

const searchSites = [
  PowerDataComSite,
  EchodriveEchoCom
]

export class Search {
    private tedis: Tedis = new Singleton().getInstance();
    private mode: IMode = getMode();
    private settings = this.mode === 'develop' ? Settings : {};
    private searchSites: Array<SearchSite> = [];

    public run() {
        this.developPrepare();
        puppeteer
            .launch({
                ...this.settings,
                args: ['no-sandbox', 'disable-setuid-sandbox']
            })
            .then(async (browser: puppeteer.Browser) => {
                await this.prePareSite(browser, searchSites);
                await this.getTask();
            });
    }

    private async prePareSite(
      browser: puppeteer.Browser,
      SiteClasses: Array<new (browser: puppeteer.Browser) => SearchSite>
    ) {
      SiteClasses.forEach(async SiteClass => {
        const site = new SiteClass(browser);
        await site.prePare();
        this.searchSites.push(site);
      })
    }

    private async getTask() {
        const taskResult = (await this.tedis.blpop(0, 'search_tasks'))[1];
        console.log('task:', taskResult);
        if (taskResult) {
            const task: ITASK = JSON.parse(taskResult) as ITASK;
            this.searchSites.forEach((site) => {
                site.search(task);
            });
        }
    }

    private developPrepare() {
        if (this.mode === 'develop') {
            const taskResult = JSON.stringify({
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
