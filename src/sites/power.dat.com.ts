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
    private loginPage = 'https://power.dat.com/login';
    private searchPage = 'https://power.dat.com/search/loads';
    private page: puppeteer.Page;

    public async prepare(name: string, password: string) {
        try {
            console.log('PowerDatComSite begin prepare', name, password);
            this.page = await this.browser.newPage();
            await this.page.goto(this.loginPage, {
                timeout: 0,
                waitUntil: 'load'
            });
            await this.page.type('#username', name);
            await this.page.type('#password', password);
            await this.page.click('button#login');
            await this.page.waitForNavigation({
                waitUntil: 'domcontentloaded'
            });
            console.log('PowerDatComSite waitForNavigation ...');
            this.isLogin = true;
        } catch (e) {
            console.log('PowerDatComSite prepare error', e);
        }
    }

    public async search(task: ITASK) {
        try {
            // new page, goto search url, wait for loaded
            this.page = await this.browser.newPage();
            this.page.setViewport({
                width: 1200,
                height: 1200
            })
            this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36')
            console.log('userAgent 2',await this.page.evaluate(() => navigator.userAgent ))
            await this.page.goto(this.searchPage, {
                waitUntil: [
                    'load'
                ]
            }).catch(e => {
                console.log('PowerDatComSite goto search page', e)
                throw new SiteError('search', 'PowerDatComSite goto search page')
            });

            // create new search
            await this.page.click('.newSearch').catch(e => {
                console.log('PowerDatComSite newSearch click', e)
                throw new SiteError('search', 'PowerDatComSite newSearch click');
            })

            await this.page
                .waitForSelector('.searchListTable .origin input', {
                    timeout: 5000,
                    visible: true
                })
                .catch((e) => {
                    console.log('PowerDatComSite waitForSelector searchListTable', e)
                    throw new SiteError('search', 'PowerDatComSite waitForSelector searchListTable');
                });

            console.log('PowerDatComSite origin:', task.criteria.origin);
            if (task.criteria.origin) {
                await this.page
                    .type('.searchListTable .origin input', task.criteria.origin)
                    .catch((e) => {
                        console.log('PowerDatComSite type origin', e)
                        throw new SiteError('search', 'PowerDatComSite wait for selector origin');
                    });
            }

            if (task.criteria.destination) {
                await this.page
                    .type('.searchListTable .dest  input', task.criteria.destination)
                    .catch((e) => {
                        console.log('PowerDatComSite type dest', e)
                        throw new SiteError('search', 'PowerDatComSite wait for selector destination');
                    });
            }

            if (task.criteria.equipment) {
                await this.page
                    .type(
                        '.searchListTable .equipSelect input',
                        task.criteria.equipment.substr(0, 1).toUpperCase()
                    )
                    .catch((e) => {
                        console.log('PowerDatComSite type equipment', e)
                        throw new SiteError('search', 'PowerDatComSite wait for selector equipment');
                    });
            }

            await this.page
                .type('.searchListTable .dho input', task.criteria.origin_radius)
                .catch((e) => {
                    console.log('PowerDatComSite type dho', e)
                    throw new SiteError('search', 'PowerDatComSite wait for selector dho');
                });

            await this.page
                .type('.searchListTable .dhd input', task.criteria.destination_radius)
                .catch((e) => {
                    console.log('PowerDatComSite type dhd', e)
                    throw new SiteError('search', 'PowerDatComSite wait for selector dhd');
                });

            console.log('PowerDatComSite avail typing');
            await this.page
                .$eval('.searchListTable .avail input', (input) => {
                    (input as HTMLInputElement).value = '';
                })
                .catch((e) => {
                    console.log('PowerDatComSite type avail', e)
                    throw new SiteError('search', 'PowerDatComSite wait for selector avail');
                });

            const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
            await this.page.type('.searchListTable .avail  input', date).catch(e => {
                console.log('PowerDatComSite type avail 2', e)
                throw new SiteError('search', 'PowerDatComSite wait for selector avail');
            });

            await this.page.waitFor(200)

            console.log('PowerDatComSite search click');
            await this.page.click('button.search', {
                delay: 20,
                clickCount: 3
            }).catch(e => {
                console.log('PowerDatComSite click search', e)
                throw new SiteError('search', 'PowerDatComSite wait for selector avail');
            })

            console.log('PowerDatComSite wait result');
            await this.page
                .waitForSelector('.resultItem', {
                    timeout: 10000
                })
                .catch((e) => {
                    console.log('PowerDatComSite result error:', e);
                    throw new SiteError('search', 'PowerDatComSite wait for resultItem');
                });

            console.log('PowerDatComSite have result');
            const resultItems = await this.page.$$('.resultItem.exactMatch').catch(e => {
                console.log('PowerDatComSite $$ resultItem', e);
                throw new SiteError('search', 'PowerDatComSite $$ resultItem');
            });

            
            console.log('click resultItem')
            for (let n = 1, len = resultItems.length; n <= len; n++) {
                await this.page.click(`.resultItem.exactMatch:nth-child(${n + 1})`).catch(e => {
                    console.log(`.resultItem.exactMatch:nth-child(${n + 1})`, e)
                    throw new SiteError('search', 'result item click' + (n + 1))
                });
            }

            await this.page.waitForSelector(
                `.resultItem.exactMatch:nth-child(${resultItems.length + 1}) .widget-numbers`,
                {
                    timeout: 10000
                }
            ).catch(e => {
                console.log(`.resultItem.exactMatch:nth-child(${resultItems.length + 1}) .widget-numbers`, e)
                throw new SiteError('search', 'waitForSelector result item detail' + (resultItems.length + 1))
            });

            const resultHtml = await this.page.$eval('.searchResultsTable', (res) => res.innerHTML).catch(e => {
                console.log('PowerDatComSite $eval .searchResultsTable', e);
                throw new SiteError('search', 'PowerDatComSite $eval .searchResultsTable')
            });
            const $ = cheerio.load(resultHtml);
            const items = Array.from($('.resultItem.exactMatch')).map((item: any) => {
                return GetDataFromHtml(task, $(item), $);
            });

            console.log('PowerDatComSite post data:', $('.resultItem.exactMatch').html(), items, ModifyPostData(task.task_id, items));
            await PostSearchData(ModifyPostData(task.task_id, items)).then((res: any) => {
                console.log(res.data);
            });
            console.log('PowerDatComSite search end')
        } catch (e) {
            console.log('PowerDatComSite **** catched ****', e);
        }
    }

    public async closePage() {
        // await this.page.close();
    }
}
