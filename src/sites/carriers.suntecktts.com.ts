import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { getRadiusFromValues } from '../tools/index';
import cheerio from 'cheerio';

export class Sunteck extends SearchSite {
    public static siteName = 'Sunteck';
    protected debugPre = 'Sunteck';
    protected loginPage = 'https://carriers.suntecktts.com/login';
    protected searchPage = 'https://carriers.suntecktts.com/freight/';

    protected async login(task: ITASK) {
        await this.page.waitForSelector('#_submit:not(:disabled)', {
            timeout: 20000
        });
        await this.page.type('#username', task.email);
        await this.page.type('#password', task.password);
        await this.page.click('#_submit');
        await this.page.waitForSelector('[name=load_board_search]', { timeout: 10000 });
    }

    protected async search(task: ITASK) {
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
            String(
                getRadiusFromValues(Number(task.criteria.destination_radius), [50, 100, 200, 300])
            )
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
            .catch(() => {
                throw this.generateError('noData', 'have no data');
            });

        const resultHtml = await this.page.$eval(
            '#js-load-board-results',
            (input) => input.outerHTML
        );

        const $ = cheerio.load(resultHtml);
        const resultData = this.getDataFromHtml($, task);

        await this.postData(task, resultData)
    }

    private getDataFromHtml($: CheerioStatic, task: ITASK): Array<IResultHTMLData> {
        const result: Array<IResultHTMLData> = [];
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
            ] = Array.from($(element).find('td')).map((el) => $(el).text());

            result.push({
                origin_radius: '',
                destination_radius: '',
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
                distance: miles,
                contact,
                phone,
                email,
                load
            });
        });
        return result;
    }
}
