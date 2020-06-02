import cheerio from 'cheerio';
import { SearchSite } from './searchSite';
import { createUrl } from '../tools/index';
import dateformat from 'dateformat';
import { SiteQueue, DetailPage } from '../tools/siteQueue';

export class CHRobinson extends SearchSite {
    public static siteName = 'CH Robinson';
    protected debugPre = 'CH Robinson';
    protected loginPage = 'https://www.navispherecarrier.com/login';
    protected searchPage = '';
    private host = 'https://www.navispherecarrier.com';

    protected async shouldLogin(): Promise<boolean> {
        const userToken = await this.page.evaluate(() => {
            return localStorage.getItem('navisphere_carrier.user_token');
        });
        return !userToken;
    }

    protected async login(task: ITASK) {
        await this.page.waitForSelector('#Username', {
            timeout: 5000
        });
        await this.page.type('#Username', task.email).catch((e) => {
            this.log.log('type Username', e);
        });
        await this.page.waitForSelector('#Password');
        await this.page.type('#Password', task.password).catch((e) => {
            this.log.log('type Password', e);
        });
        await this.page.waitForSelector('#btnLogin');
        await this.page.evaluate(() => {
            let btn: HTMLElement = document.querySelector('#btnLogin') as HTMLElement;
            btn.click();
        });
        await this.page.waitForSelector('div.find-loads', { timeout: 10000 });
    }

    protected async beforeSearch(task: ITASK) {
        // check task origin
        if (
            task.criteria.origin.indexOf(',') === -1 ||
            task.criteria.destination.indexOf(',') === -1
        ) {
            return;
        }

        // origin: 'New York, NY',
        const [originCity, originStateProvinceCode] = task.criteria.origin
            .split(',')
            .map((item) => item.trim());
        const [destinationCity, destinationStateProvinceCode] = task.criteria.destination
            .split(',')
            .map((item) => item.trim());
        // &pickupStart=2020-05-17T08%3A00%3A00
        // &pickupStart=2020-05-17T08%3A00%3A00&pickupEnd=2020-05-18T08%3A00%3A00
        const pickupStart = dateformat(
            task.criteria.pick_up_date,
            "yyyy-mm-dd'T'HH:MM:ss"
        ) as string;
        const pickupEnd = dateformat(
            new Date(Date.parse(pickupStart) + 24 * 3600 * 1000),
            "yyyy-mm-dd'T'HH:MM:ss"
        ) as string;
        const search = {
            originCountryCode: 'US',
            originStateProvinceCode,
            originCity,
            originRadiusMiles: task.criteria.origin_radius,
            destinationCountryCode: 'US',
            destinationStateProvinceCode,
            destinationCity,
            destinationRadiusMiles: task.criteria.destination_radius,
            pickupStart,
            pickupEnd,
            mode: task.criteria.equipment.substr(0, 1).toUpperCase()
        };

        this.searchPage = createUrl(this.host + '/find-loads/singl', search);
        await super.beforeSearch(task);
    }

    protected async search(task: ITASK) {
        await this.page.waitForSelector('.loading-indicator', {
            timeout: 10000,
            hidden: true
        });

        await this.page.waitForSelector('.data-table', {
            timeout: 20000
        });

        const resultHtml = await this.page.$eval('.data-table', (res) => res.outerHTML);
        const $ = cheerio.load(resultHtml);
        const resultData = this.getDataFromHtml($, task.task_id);

        const detailNumbers = resultData.map((item) => item['loadNumber']) as Array<string>;
        let linksAndData = detailNumbers.map((id, index) => {
            return {
                link: `https://www.navispherecarrier.com/find-load-details/${id}`,
                data: {
                    ...resultData[index]
                }
            };
        });

        this.log.log(
            'links',
            linksAndData.map((item) => item.link)
        );

        const detailPages = linksAndData.map((item) => {
            const instance = new CHRobinsonDetailPage(item.link, item.data);
            instance.prePare(this.browser, task, this);
            return instance;
        });

        const siteQueue = new SiteQueue(detailPages, 5);
        await siteQueue.search();
    }

    private getDataFromHtml($: CheerioStatic, taskID: string): Array<any> {
        const result: any = [];
        $('tbody tr').each((_index, item) => {
            const resultItem = [];
            $(item)
                .find('td')
                .each((_tdIndex, tdItem) => {
                    resultItem.push($(tdItem).text());
                });
            let [
                loadNumber,
                origin,
                date,
                origin_radius,
                destination,
                _dropOff,
                destination_radius,
                weight,
                distance,
                equipment,
                endorsement
            ] = resultItem;
            date = dateformat(date.substr(0, 10), 'yyyy-mm-dd HH:MM:ss');
            loadNumber = (loadNumber as String).match(/\d+/)[0];
            result.push({
                loadNumber,
                origin,
                date,
                origin_radius,
                destination,
                weight,
                distance,
                equipment,
                endorsement,
                destination_radius
            });
        });
        return result;
    }
}

class CHRobinsonDetailPage extends DetailPage {
    protected debugPre = 'CHRobinsonDetailPage';
    protected async search(task: ITASK): Promise<void> {
        await this.page.waitForSelector('.data-table', {
            timeout: 5000
        });
        const $ = cheerio.load(await this.page.content());
        let pickUpData = {};
        let dropOffData = {};
        $('.data-table tbody tr').each((_index, tr) => {
            let resultTableTr = [];
            $(tr)
                .find('td')
                .each((_index, td) => {
                    resultTableTr.push($(td).text());
                });
            const [pickOrDrop, dateTime, location, driverWork, weight, distance] = resultTableTr;
            if (pickOrDrop.indexOf('Pickup') > -1) {
                pickUpData = {
                    dateTime: dateTime.replace(/(\d{2}\/\d{2}\/\d{4})/, '$1 '),
                    location,
                    driverWork,
                    weight,
                    distance
                };
            } else {
                dropOffData = {
                    dateTime: dateTime.replace(/(\d{2}\/\d{2}\/\d{4})/, '$1 '),
                    location,
                    driverWork,
                    weight,
                    distance
                };
            }
        });

        // requirements data
        const requirementData = {};
        $('.load-requirements .requirement').each((_index, item) => {
            const key = $(item).find('.requirement-label').text();
            const value = $(item).find('.value').text();
            requirementData[key] = value;
        });

        const contactData = [];
        $('.contact-rep-section .col-sm-6').each((_index, item) => {
            const name = $(item).find('h5').text();
            const phone = $(item).find('#phone-rep-btn').text();
            const email = $(item).find('#email-rep-btn').text();
            contactData.push({
                name,
                phone,
                email
            });
        });

        const data: any = {
            pickUpData,
            dropOffData,
            requirementData,
            contactData,
            ...this.getOriginalData()
        };

        await this.searchSite.postData(task, [data as IResultHTMLData]);
    }
}
