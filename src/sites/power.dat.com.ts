import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { Tedis } from 'tedis';
import { account } from '../account';
import { SearchSite } from './search.site';
import { Singleton } from '../tools/tedis';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { Post } from '../api';
import { GetDataFromHtml } from '../tools/power.data.com';

export class PowerDataComSite extends SearchSite {
    private url = 'https://power.dat.com/';
    private searchPage = 'https://power.dat.com/search/loads';
    private name: string = account['power.dat.com'].name;
    private password: string = account['power.dat.com'].password;
    private page: puppeteer.Page;
    private tedis: Tedis = new Singleton().getInstance();

    public async prePare() {
        try {
            console.log('PowerDataComSite begin prePare');
            this.page = await this.browser.newPage();
            await this.page.goto(this.url);
            await this.page.type('#username', this.name);
            await this.page.type('#password', this.password);
            this.page.click('button#login');
            await this.page.waitForNavigation();
            await this.page.goto(this.searchPage);
            await this.page.waitForSelector('.newSearch', {
                timeout: 5000
            });
        } catch (e) {
            console.log('PowerDataComSite prepare error');
        }
    }

    public async search(task: ITASK) {
        try {
            const addSearchButton = await this.page.$('.newSearch').catch(() => {
                throw new SiteError('search', 'wait for addSearchButton');
            });
            const searchValueDisabled = await this.page.$eval('.newSearch', (el) =>
                el.getAttribute('disabled')
            );
            if (searchValueDisabled !== 'disabled') {
                addSearchButton.click({
                    clickCount: 4,
                    delay: 100
                });
                console.log('PowerDataComSite addSearchButton click');
            }

            await this.page
                .waitForSelector('.searchListTable .origin input', {
                    timeout: 10000,
                    visible: true
                })
                .catch(() => {
                    throw new SiteError('search', 'wait for selector');
                });

            console.log('PowerDataComSite origin:', task.criteria.origin);
            if (task.criteria.origin) {
                await this.page
                    .type('.searchListTable .origin  input', task.criteria.origin)
                    .catch(() => {
                        throw new SiteError('search', 'wait for selector origin');
                    });
            }

            if (task.criteria.destination) {
                await this.page
                    .type('.searchListTable .dest  input', task.criteria.destination)
                    .catch(() => {
                        throw new SiteError('search', 'wait for selector destination');
                    });
            }

            if (task.criteria.equipment) {
                await this.page
                    .type(
                        '.searchListTable .equipSelect input',
                        task.criteria.equipment.substr(0, 1).toUpperCase()
                    )
                    .catch(() => {
                        throw new SiteError('search', 'wait for selector equipment');
                    });
            }

            await this.page
                .type('.searchListTable .dho  input', task.criteria.origin_radius)
                .catch(() => {
                    throw new SiteError('search', 'wait for selector dho');
                });

            console.log('PowerDataComSite task.criteria.destination_radius', task.criteria.destination_radius);
            await this.page
                .type('.searchListTable .dhd  input', task.criteria.destination_radius)
                .catch(() => {
                    throw new SiteError('search', 'wait for selector dhd');
                });

            console.log('PowerDataComSite avail typing');
            await this.page
                .$eval('.searchListTable .avail input', (input) => {
                    (input as HTMLInputElement).value = '';
                })
                .catch(() => {
                    throw new SiteError('search', 'wait for selector avail');
                });

            const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
            await this.page.type('.searchListTable .avail  input', date).catch(() => {
                throw new SiteError('search', 'wait for selector avail');
            });

            await this.page.click('.filter-panel-toggle');

            await this.page.waitFor(200);

            console.log('PowerDataComSite search click');
            await this.page.click('button.search', {
                delay: 20,
                clickCount: 3
            });

            console.log('PowerDataComSite wait result');
            await this.page
                .waitForSelector('.resultItem.exactMatch', {
                    timeout: 5000
                })
                .catch((e) => {
                    console.log('PowerDataComSite result error:', e);
                    throw new SiteError('search', 'wait for resultItem');
                });

            const resultItems = await this.page.$$('.resultItem.exactMatch');
            for (let n = 1, len = resultItems.length; n <= len; n++) {
                await this.page.click(`.resultItem.exactMatch:nth-child(${n + 1})`);
                await this.page.waitForSelector(
                    `.resultItem.exactMatch:nth-child(${n + 1}) .widget-numbers`,
                    {
                        timeout: 5000
                    }
                );
            }

            const resultHtml = await this.page.$eval('.search-details', (res) => res.innerHTML);
            const $ = cheerio.load(resultHtml);
            const items = Array.from($('.resultItem')).map((item: any) => {
                return GetDataFromHtml($(item), $);
            });

            console.log('PowerDataComSite post data:', items);
            await Post(ModifyPostData(task.task_id, items)).then((res: any) => {
                console.log(res.data);
            });

            await this.page.click('.qa-my-searches-delete');
        } catch (e) {
            console.log('PowerDataComSite **** catched ****', e);
        }
    }
}
