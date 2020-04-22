import puppeteer from 'puppeteer';
import { PowerDataComSite } from './sites/power.dat.com';
import { Settings } from './settings';
import { getMode } from './tools/index';
import { SearchSite } from './sites/search.site';
import { Singleton } from './tools/tedis';
import { Tedis } from 'tedis';

const tedis: Tedis = new Singleton().getInstance();
const mode: IMode = getMode();
const settings = mode === 'develop' ? Settings : {};

async function siteBrowser(
    SiteClass: new (browser: puppeteer.Browser) => SearchSite,
    browser: puppeteer.Browser
) {
    const site = new SiteClass(browser);
    await site.prePare();
    await site.doTask();
}

if (mode === 'develop') {
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
    tedis.lpush('search_tasks', taskResult);
}

puppeteer
    .launch({
        ...settings,
        args: ['no-sandbox', 'disable-setuid-sandbox']
    })
    .then(async (browser: puppeteer.Browser) => {
        await siteBrowser(PowerDataComSite, browser);
    });
