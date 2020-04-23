import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { GetDataFromHtml } from '../tools/power.data.com';

export class PowerDatComSite extends SearchSite {
    public siteName = 'DAT';
    public isLogin = false;
    private loginPage = 'https://power.dat.com/';
    private searchPage = 'https://power.dat.com/search/loads';
    private page: puppeteer.Page;

    public async prepare(name: string, password: string) {
        try {
            console.log('PowerDatComSite begin prepare', name, password);
            this.page = await this.browser.newPage();
            await this.page.goto(this.loginPage);
            await this.page.type('#username', name);
            await this.page.type('#password', password);
            await this.page.click('button#login');
            // await this.page.waitForNavigation();
            console.log('PowerDatComSite waitForNavigation ...');
            this.isLogin = true;
        } catch (e) {
            console.log('PowerDatComSite prepare error', e);
        }
    }

    public async search(task: ITASK) {
        try {
            this.page = await this.browser.newPage();
            await this.page.goto(this.searchPage);
            await this.page.waitForSelector('.newSearch', {
                timeout: 5000
            });
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
                console.log('PowerDatComSite addSearchButton click');
            }

            await this.page
                .waitForSelector('.searchListTable .origin input', {
                    timeout: 10000,
                    visible: true
                })
                .catch(() => {
                    throw new SiteError('search', 'wait for selector');
                });

            console.log('PowerDatComSite origin:', task.criteria.origin);
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

            console.log(
                'PowerDatComSite task.criteria.destination_radius',
                task.criteria.destination_radius
            );
            await this.page
                .type('.searchListTable .dhd  input', task.criteria.destination_radius)
                .catch(() => {
                    throw new SiteError('search', 'wait for selector dhd');
                });

            console.log('PowerDatComSite avail typing');
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

            console.log('PowerDatComSite to click filter-panel-toggle')

            await this.page.click('.filter-panel-toggle');

            await this.page.waitFor(200);

            console.log('PowerDatComSite search click');
            await this.page.click('button.search', {
                delay: 20,
                clickCount: 3
            });

            console.log('PowerDatComSite wait result');
            await this.page
                .waitForSelector('.resultItem.exactMatch', {
                    timeout: 5000
                })
                .catch((e) => {
                    console.log('PowerDatComSite result error:', e);
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

            console.log('PowerDatComSite post data:', items);
            await PostSearchData(ModifyPostData(task.task_id, items)).then((res: any) => {
                console.log(res.data);
            });

            await this.page.click('.qa-my-searches-delete');
        } catch (e) {
            console.log('PowerDatComSite **** catched ****', e);
        }
    }

    public async closePage() {
        await this.page.close();
    }
}
