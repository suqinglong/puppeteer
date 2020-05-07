import { SearchSite } from './search.site';
import { userAgent, viewPort, waitingTimeout } from '../settings';
import dateformat from 'dateformat';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import cheerio from 'cheerio';

export class CarriersSunteckttsCom extends SearchSite {
    public static siteName = 'Carriers';
    protected debugPre = 'Carriers';
    private loginPage = 'https://carriers.suntecktts.com/login';
    private searchPage = 'https://carriers.suntecktts.com/freight/';

    protected async login(task: ITASK) {
        this.log.log('login begin');
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.loginPage, { timeout: waitingTimeout() });
        await this.page.type('#username', task.email);
        await this.page.type('#password', task.password);
        await this.page.click('#_submit');
        await this.page.waitForSelector('#load_search_form', { timeout: 10000 });
        await this.removeUserFromLogoutList(task);
        this.log.log('login success');
    }

    protected async search(task: ITASK) {
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.searchPage);

        const pickUpDate = dateformat(task.criteria.pick_up_date.split(',')[0], 'mm/dd/yyyy');
        await this.page
            .evaluate((pickUpDate: string) => {
                (document.querySelector(
                    '#load_board_search_shipDateStart'
                ) as HTMLInputElement).value = pickUpDate;
            }, pickUpDate)
            .catch((e) => {
                throw this.generateError('logout', 'logout in search page');
            });

        const [originCity, originState] = task.criteria.origin
            .split(',')
            .map((item) => item.trim());
        await this.page.type('#load_board_search_shipperCity', originCity);
        await this.page.select('#load_board_search_shipperState', originState);
        // 50, 100, 200, 300
        let shipperRadius = 50;
        const shipperRadiusN = parseInt(String(Number(task.criteria.origin_radius) / 100), 10);
        if (shipperRadiusN > 1 && shipperRadiusN < 300) {
            shipperRadius = shipperRadiusN * 100;
        } else {
            throw this.generateError('search', 'shipperRadius too big');
        }
        await this.page.select('#load_board_search_shipperRadius', String(shipperRadius));

        const [destCity, destState] = task.criteria.origin.split(',').map((item) => item.trim());
        await this.page.type('#load_board_search_consigneeCity', destCity);
        await this.page.select('#load_board_search_consigneeState', destState);
        // 50, 100, 200, 300
        let consigneeRadius = 50;
        const consigneeRadiusN = parseInt(String(Number(task.criteria.origin_radius) / 100), 10);
        if (consigneeRadiusN > 1 && consigneeRadiusN < 300) {
            consigneeRadius = consigneeRadiusN * 100;
        } else {
            throw this.generateError('search', 'shipperRadius too big');
        }
        await this.page.select('#load_board_search_consigneeRadius', String(consigneeRadius));

        await this.page.click('[type=submit]');
        this.log.log('click search button');

        await this.page.waitForSelector('#autoRefresh');
        await this.page.evaluate(() => {
            (document.querySelector('#autoRefresh') as HTMLInputElement).checked = false;
        });

        await Promise.race([
            this.page
                .waitForSelector('#js-load-board-results tbody tr[role=row]', {
                    timeout: 10000
                })
                .then(() => 'hasData'),
            this.page
                .waitForSelector('#js-load-board-results .dataTables_empty', {
                    timeout: 10000
                })
                .then(() => 'noData')
        ])
            .then((raceResult) => {
                if (raceResult === 'noData') {
                    throw this.generateError('noData', 'have no data');
                }
            })
            .catch((e) => {
                this.log.log('promise search', e);
                throw this.generateError('search', 'loading data');
            });

        const resultHtml = await this.page.$eval(
            '#js-load-board-results',
            (input) => input.outerHTML
        );
        this.log.log('resultHtml', resultHtml);
        const $ = cheerio.load(resultHtml);
        const resultData = this.getDataFromHtml($, task);
        this.log.log('data', ModifyPostData(task, resultData));

        await PostSearchData(ModifyPostData(task, resultData)).then((res: any) => {
            this.log.log(res.data);
        });
    }

    private getDataFromHtml($: CheerioStatic, task: ITASK): Array<any> {
        const result = [];
        $('tbody tr[role=row]').each((_number, element) => {
            let [
                date,
                method,
                equipment,
                equipmentSize,
                shipCity,
                sst,
                destCity,
                dest,
                delivDate,
                stops,
                pieces,
                weight,
                carrRate,
                miles,
                contact,
                phone,
                email,
                load
            ] = Array.from(
                $(element)
                    .find('td')
                    .map((_index, el) => {
                        return $(el).text();
                    })
            );

            result.push({
                date,
                method,
                equipment,
                equipmentSize,
                origin: [shipCity, sst].join(','),
                destination: [destCity, dest].join(','),
                delivDate,
                stops,
                pieces,
                weight,
                carrRate,
                miles,
                contact,
                phone,
                email,
                load
            });
        });
        return result;
    }
}
