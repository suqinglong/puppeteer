import { SearchSite } from './searchSite';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { ElementHandle } from 'puppeteer';

export class DAT extends SearchSite {
    public static siteName = 'DAT';
    protected debugPre = 'DAT';
    protected loginPage = 'https://power.dat.com/login';
    protected searchPage = 'https://power.dat.com/search/loads';

    public async login(task: ITASK) {
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
    }

    public async search(task: ITASK) {
        await this.page.click('.carriers .search')
        // create new search
        await this.page.waitForSelector('.newSearch', {
            timeout: 5000
        });

        await this.page.click('.newSearch', { delay: 100 })

        this.log.log('wait for origin input')
        await this.page.waitForSelector('.searchListTable .origin input', {
            timeout: 10000,
            visible: true
        })

        this.log.log('select equipment', task.criteria.equipment.toLowerCase())
        await this.page.waitFor(200)

        if (task.criteria.equipment) {
            await this.page.focus('.searchListTable .equipSelect input#s2id_autogen2')
            for (let i = 0; i < 10; i++) {
                await this.page.keyboard.press('Backspace');
            }
            await this.page.type('.searchListTable .equipSelect input#s2id_autogen2',
                task.criteria.equipment, {
                delay: 200
            })
            await this.page.waitForSelector('body > .select2-drop ul.select2-results li.select2-result-selectable')
            const selectIndex = await this.page.evaluate((equipment: string) => {
                let result = 1
                document.querySelectorAll('body > .select2-drop ul.select2-results li.select2-result-selectable').forEach((el, index) => {
                    if (el.querySelector('.select2-formatresult-code').textContent === equipment) {
                        result = index + 1
                    }
                })
                return result
            }, task.criteria.equipment.substr(0, 1).toUpperCase())

            await this.page.click(`body > .select2-drop ul.select2-results li.select2-result-selectable:nth-child(${selectIndex})`)
        }

        this.log.log('type origin')
        if (task.criteria.origin) {
            await this.page.type('.searchListTable .origin input', task.criteria.origin)
        }

        this.log.log('type destination')
        if (task.criteria.destination) {
            await this.page.type('.searchListTable .dest input', task.criteria.destination)
        }

        this.log.log('type origin_radius')
        await this.page.type('.searchListTable .dho input', task.criteria.origin_radius)

        this.log.log('type destination_radius')
        await this.page.type('.searchListTable .dhd input', task.criteria.destination_radius)


        this.log.log('type pick_up_date')
        await this.page.focus('.searchListTable .avail input');
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
        await this.page.type('.searchListTable .avail input', date)
        await this.page.keyboard.press('Enter');

        this.log.log('wait result');
        await this.page
            .waitForSelector('.resultItem', {
                timeout: 10000
            })
            .catch(() => {
                throw this.generateError('noData', 'wait for result');
            });
        await this.page.click('.carriers .search')

        const resultItems = await this.page.$$('.resultItem.exactMatch').catch((e) => {
            throw this.generateError('search', '$$ .resultItem.exactMatch');
        });

        this.page.on('response', async (res) => {
            if (res.url().indexOf('/search/matches/take') > -1) {
                this.log.log(res.url(), await res.json())
            }
        })

        this.page.on('request', (res) => {
            if (res.url().indexOf('/search/matches/take') > -1) {
                this.log.log('request', res.url())
            }
        })

        this.page.on('error', e => {
            this.log.log(e)
        })

        const resultSubItems = Array.from(resultItems);
        const resultSubItemsLength = 2// resultSubItems.length;
        const expendCountPerTime = 2
        this.log.log('have result:', resultSubItemsLength);
        let extendIndex = 0
        await this.page.waitFor(2000)
        while (extendIndex < resultSubItemsLength) {
            const extendsPromises = []
            for (let i = 0; i < expendCountPerTime; i++) {
                if (extendIndex < resultSubItemsLength) {
                    extendsPromises.push(this.getExtendItemData(resultSubItems[extendIndex++], task))
                }
            }
            await Promise.all(extendsPromises)
        }
    }

    protected async afterSearch() {
        await this.cleanSearch();
    }

    private async getExtendItemData(element: ElementHandle, task: ITASK) {

        try {
            await this.page.waitFor(200)
            const index = await this.page.evaluate((element: HTMLElement) => {
                const resultTable = document.querySelector('table.searchResultsTable')
                return Array.from(resultTable.children).findIndex(item => item === element)
            }, element)

            this.log.log('index', index)

            if (index > -1) {
                await this.page.click(`.resultItem:nth-child(${index + 1}) .age`, {
                    delay: 100
                })
            }

            await new Promise((resolve, reject) => {
                let si: NodeJS.Timeout
                let st: NodeJS.Timeout
                let n = 0

                si = setInterval(async () => {
                    const hasNumber = await this.page.evaluate((element: HTMLElement, n: number) => {
                        const clickEl = element.querySelector('.avail') as HTMLElement
                        clickEl.style.color = 'red'
                        clickEl.setAttribute('n', String(n))
                        clickEl.click()
                        return !!element.querySelector('.widget-numbers')
                    }, element, n++)

                    if (hasNumber) {
                        clearTimeout(st)
                        clearInterval(si)
                        resolve()
                    }
                }, 1000)

                st = setTimeout(() => {
                    clearTimeout(st)
                    clearInterval(si)
                    resolve()
                }, 10000);

            }).catch((e) => {
                this.log.log(e)
                throw this.generateError('search', 'error in extend detail')
            })

            if (index > -1) {
                await this.page.waitForSelector(`.resultItem:nth-child(${index + 1}) .widget-numbers`)
            }

            this.log.log(await this.page.evaluate((el: HTMLElement) => {
                return el.outerHTML
            }, element))

            const result = await element.evaluate((el: HTMLElement) => {
                const result = {}
                const dataItemClass = [
                    '.age',
                    ['.avail', 'pickUp'],
                    ['.truck', 'equipment'],
                    '.fp',
                    ['.do', 'origin_radius'],
                    '.origin',
                    '.trip',
                    ['.dest', 'destination'],
                    ['.dd', 'destination_radius'],
                    '.company',
                    '.contact',
                    '.length',
                    '.weight',
                    '.cs',
                    '.dtp',
                    '.factorable',
                    '.rate'
                ];

                dataItemClass.forEach((item) => {
                    let key: string;
                    let selector: string;
                    if (Array.isArray(item)) {
                        [selector, key] = item;
                    } else {
                        selector = item;
                        key = item.substr(1);
                    }
                    if (key === 'factorable') {
                        result[key] = el.querySelector('.factorable .trackLink') ? 'yes' : 'no'
                    } else {
                        result[key] = el.querySelector(selector).textContent
                    }
                });

                // details

                el.querySelectorAll('.resultDetails dl').forEach(dl => {
                    const dtDdNodes = dl.querySelectorAll('dt, dd')
                    let key = ''
                    dtDdNodes.forEach(item => {
                        if (item.tagName === 'DT') {
                            key = item.textContent.trim().replace(':', '').toLowerCase()
                        } else if (item.tagName === 'DD') {
                            result[key] = result[key] ? result[key] + " " + item.textContent : item.textContent
                        }
                    })
                })

                const rateview = {}
                rateview['title'] = el.querySelector('.fm-rateview-widget-title').textContent + ' (' + el.querySelector('.widget-title-incl-text').textContent + ')'
                rateview['num'] = el.querySelector('.widget-numbers-num').textContent
                rateview['range'] = el.querySelector('.widget-numbers-range').textContent
                result['rateview'] = rateview
                return result
            }, element)

            for (let key in result) {
                if (typeof result[key] === 'string') {
                    result[key] = result[key].replace(/[\t\n]+/g, '').trim()
                }
            }
            result['date'] = result['age'] + ' ' + result['pickUp'] + ' ' + (new Date()).getFullYear()

            await PostSearchData(ModifyPostData(task, [result])).then((res: any) => {
                this.log.log(res.data);
            });
        } catch (e) {
            this.log.log(e)
            this.log.log(await this.page.evaluate((el: HTMLElement) => {
                return el.outerHTML
            }, element))
            this.log.log('pass this detail')
        }
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
