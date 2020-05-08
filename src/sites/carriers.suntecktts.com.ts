import { SearchSite } from './search.site';
import { userAgent, viewPort, waitingTimeout } from '../settings';
import dateformat from 'dateformat';
import { ModifyPostData, getRadiusFromValues } from '../tools/index';
import { PostSearchData } from '../api';
import cheerio from 'cheerio';

export class Sunteck extends SearchSite {
    public static siteName = 'Sunteck';
    protected debugPre = 'Sunteck';
    private loginPage = 'https://carriers.suntecktts.com/login';
    private searchPage = 'https://carriers.suntecktts.com/freight/';

    protected async login(task: ITASK) {
        this.log.log('login begin');
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.loginPage, { timeout: waitingTimeout() });
        await this.page.waitForSelector('#_submit:not(:disabled)', {
            timeout: 20000
        });
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
        await this.page.goto(this.searchPage, {
            timeout: 20000
        });

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

        await this.page.select(
            '#load_board_search_shipperRadius',
            String(getRadiusFromValues(Number(task.criteria.origin_radius), [50, 100, 200, 300]))
        );

        const [destCity, destState] = task.criteria.destination
            .split(',')
            .map((item) => item.trim());
        await this.page.type('#load_board_search_consigneeCity', destCity);
        await this.page.select('#load_board_search_consigneeState', destState);

        await this.page.select(
            '#load_board_search_consigneeRadius',
            String(getRadiusFromValues(Number(task.criteria.destination_radius), [50, 100, 200, 300]))
        );

        await this.page.click('[type=submit]');
        this.log.log('click search button');

        await this.page.waitForSelector('#autoRefresh');
        await this.page.evaluate(() => {
            (document.querySelector('#autoRefresh') as HTMLInputElement).checked = false;
        });

        await this.page
            .waitForSelector('#js-load-board-results tbody tr[role=row]', {
                timeout: 5000
            })
            .catch((e) => {
                throw this.generateError('noData', 'have no data');
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
