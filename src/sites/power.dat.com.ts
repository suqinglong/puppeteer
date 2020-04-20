import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { Tedis } from 'tedis';
import { account } from '../account';
import { SearchSite } from './search.site';
import { Singleton } from '../tools/tedis';
import { SiteError } from '../error'

export class PowerDataComSite extends SearchSite {
    private url = 'https://power.dat.com/';
    private searchPage = 'https://power.dat.com/search/loads';
    private name: string = account['power.dat.com'].name;
    private password: string = account['power.dat.com'].password;
    private page: puppeteer.Page;
    private tedis: Tedis = new Singleton().getInstance()

    public async prePare() {
        try {
            console.log('begin prePare');
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
            console.log("prepare error")
        }
    }

    public async doTask() {
        const taskResult = (await this.tedis.blpop(0, 'search_tasks'))[1];
        console.log('task:', taskResult)
        if (taskResult) {
            const task: ITASK = JSON.parse(taskResult) as ITASK;
            this.search(task);
        }
    }

    private async search(task: ITASK) {
        try {
            const addSearchButton = await this.page.$('.newSearch')
                .catch(() => {
                    throw new SiteError('search', 'wait for addSearchButton')
                });
            const searchValueDisabled = await this.page.$eval('.newSearch', (el) =>
                el.getAttribute('disabled')
            );
            if (searchValueDisabled !== 'disabled') {
                addSearchButton.click({
                    clickCount: 4,
                    delay: 100
                });
                console.log('addSearchButton click');
            }

            await this.page.waitForSelector('.searchListTable .origin input', { timeout: 10000, visible: true })
                .catch(() => {
                    throw new SiteError('search', 'wait for selector')
                })

            console.log('origin:', task.criteria.origin);
            if (task.criteria.origin) {
                await this.page.type('.searchListTable .origin  input', task.criteria.origin)
                    .catch(() => {
                        throw new SiteError('search', 'wait for selector origin')
                    })
            }

            if (task.criteria.destination) {
                await this.page.type('.searchListTable .dest  input', task.criteria.destination)
                    .catch(() => {
                        throw new SiteError('search', 'wait for selector destination')
                    })
            }

            if (task.criteria.equipment) {
                await this.page.type('.searchListTable .equipSelect input', task.criteria.equipment.substr(0, 1).toUpperCase())
                    .catch(() => {
                        throw new SiteError('search', 'wait for selector equipment')
                    })
            }

            await this.page.type('.searchListTable .dho  input', task.criteria.origin_radius)
                .catch(() => {
                    throw new SiteError('search', 'wait for selector dho')
                })

            console.log('task.criteria.destination_radius', task.criteria.destination_radius)
            await this.page.type('.searchListTable .dhd  input', task.criteria.destination_radius)
                .catch(() => {
                    throw new SiteError('search', 'wait for selector dhd')
                })

            await this.page.$eval('.searchListTable .avail input', (input) => {
                (input as HTMLInputElement).value = '';
            }).catch(() => {
                throw new SiteError('search', 'wait for selector avail')
            })

            const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
            await this.page.type('.searchListTable .avail  input', date)
                .catch(() => {
                    throw new SiteError('search', 'wait for selector avail')
                })

            this.page.click('button.search');

            await this.page.waitForSelector('.resultItem.exactMatch', {
                timeout: 5000
            }).catch(() => {
                throw new SiteError('search', 'wait for resultItem')
            })

            const resultItems = await this.page.$$('.resultItem.exactMatch')

            for (let n = 1, len = resultItems.length; n <= len; n++) {
                await this.page.click(`.resultItem.exactMatch:nth-child(${n + 1})`)
                await this.page.waitForSelector(`.resultItem.exactMatch:nth-child(${n + 1}) .widget-numbers`, {
                    timeout: 5000
                })
            }

            const resultHtml = await this.page.$eval('.searchResults', res => res.innerHTML);
            const $ = cheerio.load(resultHtml);
            const items = Array.from($('.resultItem')).map((item: any) => {
                const $item = $(item);
                const age = $item.find('.age').text();
                const avail = $item.find('.avail').text();
                const equipment = $item.find('.truck').text();
                const fp = $item.find('.fp').text();
                const origin_radius = $item.find('.do').text();
                const origin = $item.find('.origin').text();
                const trip = $item.find('.trip a').text();
                const destination = $item.find('.dest').text();
                const destination_radius = $item.find('.dd ').text();
                const company = $item.find('.company a').text();
                const length = $item.find('.length ').text();
                const contact = $item.find('.contact').text();
                const weight = $item.find('.weight ').text();
                const cs = $item.find('.cs a').text();
                const dtp = $item.find('.dtp a').text();
                const num = $item.find('.widget-numbers-num').text()

                return {
                    age,
                    avail,
                    equipment,
                    fp,
                    origin_radius,
                    origin,
                    trip,
                    destination,
                    destination_radius,
                    company,
                    contact,
                    length,
                    weight,
                    cs,
                    dtp,
                    num
                };
            });

            axios
                .post('http://54.219.50.46:9501/api/internal/save_search_result', {
                    token: '6bbcbce7bc90c008',
                    records: items.map((item) => {
                        let extro: any = {}

                        Object.keys(item).forEach(key => {
                            if (['date', 'source', 'equipment', 'origin',
                                'origin_radius', 'destination',
                                'destination_radius', 'distance'].indexOf(key) > -1) {
                                extro[key] = item[key]
                            }
                        })

                        return {
                            task_id: task.task_id,
                            date: task.criteria.pick_up_date,
                            source: 'DAT',
                            equipment: item.equipment,
                            origin: item.origin,
                            origin_radius: item.origin_radius,
                            destination: item.destination,
                            destination_radius: item.destination_radius,
                            distance: '',
                            extra: JSON.stringify(item)
                        };
                    })
                })
                .then((res: any) => {
                    console.log(res.data);
                });
            await this.page.click('.qa-my-searches-delete')
        } catch (e) {
            await this.doTask()
        }

        await this.doTask();
    }
}
