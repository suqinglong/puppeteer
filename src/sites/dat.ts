import { SearchSite } from './searchSite';
import { ModifyPostData, getParams } from '../tools/index';
import { PostSearchData } from '../api';
import { ElementHandle } from 'puppeteer';
import cheerio from 'cheerio';

export class DAT2 extends SearchSite {
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
        const resultBase: any = {};
        const resultDetail: any = {};
        const resultRate: any = {};
        let resultCount = 0;
        let responseCount = 0;

        let waitResultResolve: Function;

        await this.clickSearch(task);

        await this.page.waitFor(1000);

        this.page.on('response', async (res) => {
            const url = res.url();
            let data: any;

            if (url.match('/search/matches/take')) {
                data = await res.json();
                responseCount++;
                resultDetail[getParams(url, 'matchId')] = data;
                if (responseCount === 2 * resultCount) {
                    waitResultResolve(this.getData(resultBase, resultDetail, resultRate));
                }
            } else if (url.match('/search/matches')) {
                data = await res.json();
                if (data) {
                    let exactList = data.matchSet?.exact;
                    const searchId = data.searchId;
                    if (Array.isArray(exactList)) {
                        resultCount = exactList.length;
                        this.page.evaluate(
                            (exactList: Array<any>, searchId: string) => {
                                const $: any = window['$'];
                                exactList.forEach((exact) => {
                                    $.ajax(
                                        `https://power.dat.com/search/matches/take/?matchId=${exact.id}&searchId=${searchId}`
                                    );
                                    // destination "W Harrison, NY"
                                    // origin: "Paterson, NJ"
                                    // originCoordinates: "40.91667,-74.17222"
                                    let [dCity, dState] = exact.destination.split(', ');
                                    dCity = dCity.replace(' ', '+');

                                    let [oCity, oState] = exact.origin.split(', ');
                                    oCity = oCity.replace(' ', '+');

                                    let [oLat, oLong] = exact.originCoordinates.split(',');
                                    let [dLat, dLong] = exact.destinationCoordinates.split(',');
                                    $.ajax(
                                        `https://power.dat.com/search/rates/spot/?dCity=${dCity}&dLat=${dLat}&dLong=${dLong}&dState=${dState}&equipmentTypes=${exact.equipmentClass}&oCity=${oCity}&oLat=${oLat}&oLong=${oLong}&oState=${oState}&matchId=${exact.id}`
                                    );
                                });
                            },
                            exactList,
                            searchId
                        );

                        exactList.forEach((item) => {
                            resultBase[item.id] = item;
                        });
                    }
                }
            } else if (url.match('/search/rates/spot')) {
                data = await res.text();
                responseCount++;
                resultRate[getParams(url, 'matchId')] = data;
                if (responseCount === 2 * resultCount) {
                    waitResultResolve(this.getData(resultBase, resultDetail, resultRate));
                }
            }
        });

        await this.page.click('button.search');
        this.log.log('click search');

        const result: Array<any> = await new Promise((resolve) => {
            waitResultResolve = resolve;
        });

        await PostSearchData(ModifyPostData(task, result)).then((res: any) => {
            this.log.log(res.data);
        });
    }

    protected async afterSearch() {
        await this.cleanSearch();
    }

    private getData(resultBase: object, resultDetail: object, resultRate: object) {
        try {
            const result: any = [];
            Object.keys(resultBase).forEach((key) => {
                const base = resultBase[key];
                const detail = resultDetail[key];
                const rate = resultRate[key];
                const dataItem = {
                    age: base.age,
                    pickUp: base.presentationDate,
                    equipment: base.equipmentClass,
                    isPartial: base.isPartial,
                    origin_radius: base.deadheadMilesOrigin,
                    origin: base.origin,
                    trip: base.tripMiles,
                    destination: base.destination,
                    destination_radius: base.deadheadMilesDestination,
                    company: base.company,
                    length: base.length,
                    weight: base.weight,
                    creditScore: base.creditScore,
                    daysToPay: base.daysToPay,
                    factorable: base.factorableUrl ? 'yes' : 'no',
                    rate: base.rate,
                    comment1: detail.comment1 || '',
                    comment2: detail.comment2 || '',
                    docketNumber: detail.docketNumber,
                    referenceId: detail.referenceId,
                    rateView: this.getRateDataFromHtml(rate)
                };

                result.push(dataItem);
            });
            return result;
        } catch (e) {
            this.log.log('getData', e);
            throw this.generateError('search', 'getData error');
        }
    }

    private getRateDataFromHtml(html: string) {
        try {
            if (html) {
                const $ = cheerio.load(html);
                const rateView: any = {};
                rateView['title'] =
                    $('.fm-rateview-widget-title').text() +
                    ' (' +
                    $('.widget-title-incl-text').text() +
                    ')';
                rateView['num'] = $('.widget-numbers-num').text();
                rateView['range'] = $('.widget-numbers-range').text();
                return rateView;
            } else {
                return '';
            }
        } catch (e) {
            this.log.log('getRateDataFromHtml error', e);
        }
    }

    private async clickSearch(task: ITASK) {
        // create new search
        await this.page.waitForSelector('.newSearch', {
            timeout: 5000
        });

        await this.page.click('.newSearch', { delay: 100 });

        this.log.log('wait for origin input');
        await this.page.waitForSelector('.searchListTable .origin input', {
            timeout: 10000,
            visible: true
        });

        this.log.log('select equipment', task.criteria.equipment.toLowerCase());
        if (task.criteria.equipment) {
            await this.page.focus('.searchListTable .equipSelect input#s2id_autogen2');
            for (let i = 0; i < 10; i++) {
                await this.page.keyboard.press('Backspace');
            }
            await this.page.type(
                '.searchListTable .equipSelect input#s2id_autogen2',
                task.criteria.equipment,
                {
                    delay: 200
                }
            );
            await this.page.waitForSelector(
                'body > .select2-drop ul.select2-results li.select2-result-selectable'
            );
            const selectIndex = await this.page.evaluate((equipment: string) => {
                let result = 1;
                document
                    .querySelectorAll(
                        'body > .select2-drop ul.select2-results li.select2-result-selectable'
                    )
                    .forEach((el, index) => {
                        if (
                            el.querySelector('.select2-formatresult-code')?.textContent ===
                            equipment
                        ) {
                            result = index + 1;
                        }
                    });
                return result;
            }, task.criteria.equipment.substr(0, 1).toUpperCase());

            await this.page.click(
                `body > .select2-drop ul.select2-results li.select2-result-selectable:nth-child(${selectIndex})`
            );
        }

        this.log.log('type origin');
        if (task.criteria.origin) {
            await this.page.type('.searchListTable .origin input', task.criteria.origin, {
                delay: 100
            });
        }

        this.log.log('type destination');
        if (task.criteria.destination) {
            await this.page.type('.searchListTable .dest input', task.criteria.destination, {
                delay: 100
            });
        }

        this.log.log('type origin_radius', task.criteria.origin_radius);
        await this.page.focus('.searchListTable .dho input');
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        await this.page.type('.searchListTable .dho input', task.criteria.origin_radius, {
            delay: 100
        });

        this.log.log('type destination_radius', task.criteria.destination_radius);
        await this.page.focus('.searchListTable .dhd input');
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        await this.page.type('.searchListTable .dhd input', task.criteria.destination_radius, {
            delay: 100
        });

        this.log.log('type pick_up_date');
        await this.page.focus('.searchListTable .avail input');
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
        await this.page.type('.searchListTable .avail input', date);

        this.log.log('type origin_radius', task.criteria.origin_radius);
        await this.page.focus('.searchListTable .dho input');
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        await this.page.type('.searchListTable .dho input', task.criteria.origin_radius, {
            delay: 100
        });

        this.log.log('type destination_radius', task.criteria.destination_radius);
        await this.page.focus('.searchListTable .dhd input');
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        await this.page.type('.searchListTable .dhd input', task.criteria.destination_radius, {
            delay: 100
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
