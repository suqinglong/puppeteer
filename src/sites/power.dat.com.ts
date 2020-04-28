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
    public static siteName = 'DAT'
    protected siteName = 'DAT'
    private loginPage = 'https://power.dat.com/login';
    private searchPage = 'https://power.dat.com/search/loads';
    private log: Log = new Log('power.dat.com')

    public async login(task: ITASK) {
        try {
            this.log.log('login begin')

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
            this.log.log('login success')
            await this.screenshot('login success')
        } catch (e) {
            await this.addUserToLogoutList(task);
            this.log.log('login error', e)
            await this.screenshot('login_error')
        }
    }

    public async search(task: ITASK) {
        try {
            // new page, goto search url, wait for loaded
            this.page = await this.browser.newPage();
            await this.page.setViewport(viewPort);
            await this.page.setUserAgent(userAgent);
            await this.page.goto(this.searchPage, { waitUntil: 'load' }).catch((e) => {
                this.log.log('search page loaded', e)
                throw this.generateError('search', 'load search page');
            });

            // clear page popup
            await this.page.click('.carriers .search').catch(e => {
                throw this.generateError('logout', 'logout')
            })

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
                    this.log.log('waitForSelector searchListTable', e)
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
                        throw this.generateError(
                            'search',
                            'wait for selector equipment'
                        );
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

            const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
            await this.page.type('.searchListTable .avail input', date).catch((e) => {
                this.log.log('type avail', e);
                throw this.generateError('search', 'wait for selector avail');
            });

            this.log.log('search button click')
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

            this.log.log('have result');
            const resultItems = await this.page.$$('.resultItem.exactMatch').catch((e) => {
                this.log.log('$$ .resultItem.exactMatch', e)
                throw this.generateError('search', '$$ .resultItem.exactMatch');
            });

            await this.cleanSearch();
            await this.page.click('.carriers .search')
            await this.page.waitFor(2000);

            const resultSubItems = Array.from(resultItems)
            const resultSubItemsLength = resultSubItems.length
            this.log.log('expend details:', resultSubItemsLength)
            await this.screenshot('get result')

            for (let i = 0; i < resultSubItemsLength; i++) {
                await this.getDetailData(i + 2)
            }
            this.log.log('expended all details')
            await this.screenshot('expended all details')

            const resultHtml = await this.page
                .$eval('.searchResultsTable', (res) => res.outerHTML)
                .catch((e) => {
                    this.log.log('$eval .searchResultsTable', e);
                    throw this.generateError('search', '$eval .searchResultsTable');
                });
            const $ = cheerio.load(resultHtml);
            const items = Array.from($('.resultItem.exactMatch'))
                .map((item: any) => {
                    return GetDataFromHtml(task, $(item), $);
                });

            this.log.log('post data:', items);
            await PostSearchData(ModifyPostData(task, items)).then((res: any) => {
                console.log(res.data);
            });
            this.log.log('search end');
        } catch (e) {
            if (e instanceof SiteError && e.type === 'logout') {
                await this.addUserToLogoutList(task)
                await this.notifyLoginFaild(task)
            }
            await this.screenshot('search_error')
            this.log.log(' **** catched ****', e);
        }
    }

    public async closePage() {
        await this.page.close();
    }

    private async getDetailData(n: number) {
        const extendClick = await this.page.evaluate((n) => {
            const age = document.querySelector(`.resultItem.exactMatch:nth-child(${n}) .age`) as HTMLElement;
            if (age) {
                age.click()
            }
            return n
        }, n)
        this.log.log('extendClick:', extendClick)
        await this.page.waitForSelector(`.resultItem.exactMatch:nth-child(${n}) .widget-numbers-num`).catch(e => {
            if (e instanceof TimeoutError) {
                this.log.log(`timeout .resultItem.exactMatch:nth-child(${n}) .widget-numbers-num`)
            } else {
                this.log.log('getDetailData error:', e)
                throw this.generateError('search', 'getDetailData')
            }
        })
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
