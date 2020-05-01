import cheerio from 'cheerio';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { GetDataFromHtml } from '../tools/power.data.com';
import { userAgent, viewPort } from '../settings';
import { Log } from '../tools/log';
import { TimeoutError } from 'puppeteer/Errors';

export class PowerDatComSite extends SearchSite {
    public static siteName = 'DAT';
    protected debugPre = 'Echo Driver';
    private loginPage = 'https://power.dat.com/login';
    private searchPage = 'https://power.dat.com/search/loads';

    public async login(task: ITASK) {
        this.log.log('login begin');

        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);

        await this.page.goto(this.loginPage, {
            timeout: 10000,
            waitUntil: 'load'
        });

        await this.page.waitForSelector('#username');
        await this.page.type('#username', task.email);

        await this.page.waitForSelector('#password');
        await this.page.type('#password', task.password);

        await this.page.waitForSelector('#login');
        await this.page.evaluate(() => {
            let btn: HTMLElement = document.querySelector('#login') as HTMLElement;
            btn.click();
        });

        await this.page.waitForSelector('li.carriers, a.search', { timeout: 10000 });

        await this.removeUserFromLogoutList(task);
        this.log.log('login success');
        await this.screenshot('login success');
    }

    public async search(task: ITASK) {
        // new page, goto search url, wait for loaded
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.searchPage, { waitUntil: 'load' }).catch((e) => {
            this.log.log('search page loaded', e);
            throw this.generateError('search', 'load search page');
        });

        // clear page popup
        await this.page.click('.carriers .search').catch((e) => {
            throw this.generateError('logout', 'logout');
        });

        // create new search
        await this.page.waitForSelector('.newSearch', {
            timeout: 5000
        });
        await this.page
            .click('.newSearch', {
                delay: 100
            })
            .catch((e) => {
                throw this.generateError('search', 'newSearch button click');
            });

        await this.page
            .waitForSelector('.searchListTable .origin input', {
                timeout: 5000,
                visible: true
            })
            .catch((e) => {
                this.log.log('waitForSelector searchListTable', e);
                throw this.generateError('search', 'waitForSelector searchListTable');
            });

        if (task.criteria.origin) {
            await this.page
                .type('.searchListTable .origin input', task.criteria.origin)
                .catch((e) => {
                    this.log.log('type origin', e);
                    throw this.generateError('search', 'wait for selector origin');
                });
        }

        if (task.criteria.destination) {
            await this.page
                .type('.searchListTable .dest input', task.criteria.destination)
                .catch((e) => {
                    this.log.log('type dest', e);
                    throw this.generateError('search', 'wait for selector destination');
                });
        }

        if (task.criteria.equipment) {
            await this.page
                .type(
                    '.searchListTable .equipSelect input',
                    task.criteria.equipment.substr(0, 1).toUpperCase()
                )
                .catch((e) => {
                    this.log.log('type equipment', e);
                    throw this.generateError('search', 'wait for selector equipment');
                });
        }

        await this.page
            .type('.searchListTable .dho input', task.criteria.origin_radius)
            .catch((e) => {
                this.log.log('type dho', e);
                throw this.generateError('search', 'wait for selector dho');
            });

        await this.page
            .type('.searchListTable .dhd input', task.criteria.destination_radius)
            .catch((e) => {
                this.log.log('type dhd', e);
                throw this.generateError('search', 'wait for selector dhd');
            });

        await this.page
            .$eval('.searchListTable .avail input', (input) => {
                (input as HTMLInputElement).value = '';
            })
            .catch((e) => {
                this.log.log('clear avail', e);
                throw this.generateError('search', 'wait for selector avail');
            });

        await this.page.keyboard.press('Enter', { delay: 50 });

        const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
        await this.page.type('.searchListTable .avail input', date).catch((e) => {
            this.log.log('type avail', e);
            throw this.generateError('search', 'wait for selector avail');
        });

        this.log.log('search button click');
        await this.page.evaluate(() => {
            const button = document.querySelector('button.search') as HTMLElement;
            button.click();
        });

        this.log.log('wait result');
        await this.page
            .waitForSelector('.resultItem', {
                timeout: 10000
            })
            .catch((e) => {
                this.log.log('result error:', e);
                throw this.generateError('search', 'wait for result');
            });

        await this.page.click('.carriers .search');

        this.log.log('have result');
        const resultItems = await this.page.$$('.resultItem.exactMatch').catch((e) => {
            this.log.log('$$ .resultItem.exactMatch', e);
            throw this.generateError('search', '$$ .resultItem.exactMatch');
        });

        const resultHtml1 = await this.page.$eval(
            '.searchResultsTable',
            (input) => input.outerHTML
        );
        this.log.log('resultHtml1', resultHtml1);

        const resultSubItems = Array.from(resultItems);
        const resultSubItemsLength = resultSubItems.length;
        this.log.log('expend details:', resultSubItemsLength);
        await this.screenshot('get result');

        // for (let i = 0; i < resultSubItemsLength; i++) {
        //     await this.getDetailData(i + 2)
        // }

        await this.page.evaluate(async () => {
            await (async () => {
                async function sleep(num: number) {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve('test resolve');
                        }, num);
                    });
                }
                const els = Array.from(document.querySelectorAll('.resultItem.exactMatch'));
                for (let i = 0, len = els.length; i < len; i++) {
                    await sleep(200);
                    (els[i] as HTMLElement).click();
                }
            })();
        });
        await this.page.waitFor(20000);
        this.log.log('expended all details');
        await this.screenshot('expended all details');

        const resultHtml = await this.page
            .$eval('.searchResultsTable', (res) => res.outerHTML)
            .catch((e) => {
                this.log.log('$eval .searchResultsTable', e);
                throw this.generateError('search', '$eval .searchResultsTable');
            });
        const $ = cheerio.load(resultHtml);
        const items = Array.from($('.resultItem.exactMatch')).map((item: any) => {
            return GetDataFromHtml(task, $(item), $);
        });

        this.log.log('post data:', items);
        await PostSearchData(ModifyPostData(task, items)).then((res: any) => {
            this.log.log(res.data);
        });
        this.log.log('search end');
    }

    public async closePage() {
        await this.cleanSearch();
        await this.page.close();
    }

    private async getDetailData(n: number) {
        await this.page.evaluate(function (n) {
            const wh = window.innerHeight;
            for (let y = 0; y <= 300 * n; y += 10) {
                window.scrollTo(0, wh + y);
            }
        }, n);

        const extendClick = await this.page.evaluate((n) => {
            const age = document.querySelector(
                `.resultItem.exactMatch:nth-child(${n}) .age`
            ) as HTMLElement;
            if (age) {
                age.click();
                return n;
            }
            return 'getDetailData age not found';
        }, n);
        this.log.log('extendClick:', extendClick);
        if (extendClick === 'getDetailData age not found') {
            await this.screenshot('getDetailData age not found ' + n);
        }
        await this.page
            .waitForSelector(`.resultItem.exactMatch:nth-child(${n}) .widget-numbers-num`, {
                timeout: 3000
            })
            .catch((e) => {
                if (e instanceof TimeoutError) {
                    this.log.log(
                        `timeout .resultItem.exactMatch:nth-child(${n}) .widget-numbers-num`
                    );
                } else {
                    this.log.log('getDetailData error:', e);
                    throw this.generateError('search', 'getDetailData');
                }
            });
    }

    private async cleanSearch() {
        await this.page.evaluate(() => {
            document.querySelectorAll('.qa-my-searches-delete').forEach((item, key) => {
                if (key > 0) {
                    (item as HTMLElement).click();
                }
            });
        });
    }
}
