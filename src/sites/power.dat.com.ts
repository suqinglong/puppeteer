import cheerio from 'cheerio';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { GetDataFromHtml } from '../tools/power.data.com';
import { userAgent, viewPort } from '../settings';

export class PowerDatComSite extends SearchSite {
    public static siteName = 'DAT'
    private loginPage = 'https://power.dat.com/login';
    private searchPage = 'https://power.dat.com/search/loads';

    public async login(task: ITASK) {
        try {
            console.log('PowerDatComSite begin prepare', task.password);
            this.page = await this.browser.newPage();
            await this.page.setViewport(viewPort);
            await this.page.setUserAgent(userAgent);
            await this.page.goto(this.loginPage, {
                timeout: 0,
                waitUntil: 'load'
            });
            await this.page.type('#username', task.email);
            await this.page.type('#password', task.password);

            await Promise.all([
                new Promise((resove) => {
                    let st = setTimeout(() => {
                        resove()
                    }, 3000)
                    this.browser.on('targetchanged', () => {
                        clearTimeout(st)
                        resove();
                    });
                }),
                this.page.click('button#login')
            ]);
            await this.removeUserFromLogoutList(task);
            console.log('PowerDatComSite waitForNavigation ...');
        } catch (e) {
            await this.addUserToLogoutList(task);
            console.log('PowerDatComSite prepare error', e);
        }
    }

    public async search(task: ITASK) {
        try {
            // new page, goto search url, wait for loaded
            this.page = await this.browser.newPage();
            await this.page.setViewport(viewPort);
            await this.page.setUserAgent(userAgent);
            await this.page
                .goto(this.searchPage, {
                    waitUntil: ['load']
                })
                .catch((e) => {
                    console.log('PowerDatComSite goto search page', e);
                    throw new SiteError('search', 'PowerDatComSite goto search page');
                });

            await this.page.click('.carriers .search').catch(e => {
                console.log('click .carriers .search', e)
                throw new SiteError('logout', 'PowerDatComSite logout')
            })
            await this.page.waitForSelector('.newSearch');

            // create new search
            await this.page
                .click('.newSearch', {
                    delay: 100
                })
                .catch((e) => {
                    console.log('PowerDatComSite newSearch click', e);
                    throw new SiteError('search', 'PowerDatComSite newSearch click');
                });

            await this.page
                .waitForSelector('.searchListTable .origin input', {
                    timeout: 5000,
                    visible: true
                })
                .catch((e) => {
                    console.log('PowerDatComSite waitForSelector searchListTable', e);
                    throw new SiteError(
                        'search',
                        'PowerDatComSite waitForSelector searchListTable'
                    );
                });

            console.log('PowerDatComSite origin:', task.criteria.origin);
            if (task.criteria.origin) {
                await this.page
                    .type('.searchListTable .origin input', task.criteria.origin)
                    .catch((e) => {
                        console.log('PowerDatComSite type origin', e);
                        throw new SiteError('search', 'PowerDatComSite wait for selector origin');
                    });
            }

            if (task.criteria.destination) {
                await this.page
                    .type('.searchListTable .dest  input', task.criteria.destination)
                    .catch((e) => {
                        console.log('PowerDatComSite type dest', e);
                        throw new SiteError(
                            'search',
                            'PowerDatComSite wait for selector destination'
                        );
                    });
            }

            if (task.criteria.equipment) {
                await this.page
                    .type(
                        '.searchListTable .equipSelect input',
                        task.criteria.equipment.substr(0, 1).toUpperCase()
                    )
                    .catch((e) => {
                        console.log('PowerDatComSite type equipment', e);
                        throw new SiteError(
                            'search',
                            'PowerDatComSite wait for selector equipment'
                        );
                    });
            }

            await this.page
                .type('.searchListTable .dho input', task.criteria.origin_radius)
                .catch((e) => {
                    console.log('PowerDatComSite type dho', e);
                    throw new SiteError('search', 'PowerDatComSite wait for selector dho');
                });

            await this.page
                .type('.searchListTable .dhd input', task.criteria.destination_radius)
                .catch((e) => {
                    console.log('PowerDatComSite type dhd', e);
                    throw new SiteError('search', 'PowerDatComSite wait for selector dhd');
                });

            console.log('PowerDatComSite avail typing');
            await this.page
                .$eval('.searchListTable .avail input', (input) => {
                    (input as HTMLInputElement).value = '';
                })
                .catch((e) => {
                    console.log('PowerDatComSite type avail', e);
                    throw new SiteError('search', 'PowerDatComSite wait for selector avail');
                });

            const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
            await this.page.type('.searchListTable .avail  input', date).catch((e) => {
                console.log('PowerDatComSite type avail 2', e);
                throw new SiteError('search', 'PowerDatComSite wait for selector avail');
            });

            console.log('PowerDatComSite search click');
            await this.page.evaluate(() => {
                const button = document.querySelector('button.search') as HTMLElement;
                button.click();
            });

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
            const resultItems = await this.page.$$('.resultItem.exactMatch').catch((e) => {
                console.log('PowerDatComSite $$ resultItem', e);
                throw new SiteError('search', 'PowerDatComSite $$ resultItem');
            });

            await this.cleanSearch();
            await this.page.click('.carriers .search')
            await this.page.waitFor(1000);
            const resultSubItems = Array.from(resultItems)
            const resultlen = resultSubItems.length

            await this.page.evaluate((resultlen) => {
                document.querySelectorAll('.resultItem.exactMatch .age').forEach((item, key) => {
                    if (key < resultlen) {
                        setTimeout(() => {
                            (item as HTMLElement).click()
                            console.log('clicked', item)
                        }, 500)
                    }
                })
            }, resultlen)

            await this.page.waitFor(10000);

            const resultHtml = await this.page
                .$eval('.searchResultsTable', (res) => res.outerHTML)
                .catch((e) => {
                    console.log('PowerDatComSite $eval .searchResultsTable', e);
                    throw new SiteError('search', 'PowerDatComSite $eval .searchResultsTable');
                });
            const $ = cheerio.load(resultHtml);
            const items = Array.from($('.resultItem.exactMatch'))
                .map((item: any) => {
                    return GetDataFromHtml(task, $(item), $);
                });

            console.log('PowerDatComSite post data:', items);
            await PostSearchData(ModifyPostData(task, items)).then((res: any) => {
                console.log(res.data);
            });
            console.log('PowerDatComSite search end');
        } catch (e) {
            if (e instanceof SiteError && e.type === 'logout') {
                await this.addUserToLogoutList(task)
                await this.notifyLoginFaild(task)
            }
            console.log('PowerDatComSite **** catched ****', e);
        }
    }

    public async closePage() {
        await this.page.close();
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
