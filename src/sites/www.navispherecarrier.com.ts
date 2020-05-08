import cheerio from 'cheerio';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';
import dateformat from 'dateformat';
import { TimeoutError } from 'puppeteer/Errors';

export class NavispherecarrierCom extends SearchSite {
    public static siteName = 'CH Robinson';
    protected debugPre = 'CH Robinson';
    private loginPage = 'https://www.navispherecarrier.com/login';
    private host = 'https://www.navispherecarrier.com';

    protected async login(task: ITASK) {
        this.log.log('login begin');

        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);

        await this.page.goto(this.loginPage, { waitUntil: 'load', timeout: waitingTimeout() });
        this.log.log('login page loaded');

        await this.page
            .waitForSelector('#Username', {
                timeout: 5000
            })
            .catch((e) => {
                this.log.log('waitForSelector Username', e);
            });
        await this.page.type('#Username', task.email).catch((e) => {
            this.log.log('type Username', e);
        });

        await this.page.waitForSelector('#Password');
        await this.page.type('#Password', task.password).catch((e) => {
            this.log.log('type Password', e);
        });

        await this.page.waitForSelector('#btnLogin');
        // page.click('#btnLogin') doesn't works
        await this.page.evaluate(() => {
            let btn: HTMLElement = document.querySelector('#btnLogin') as HTMLElement;
            btn.click();
        });

        await this.page.waitForSelector('div.find-loads', { timeout: 10000 });
        console.log('login succeed.');

        await this.screenshot('endlogin');

        this.log.log('login success');
        await this.removeUserFromLogoutList(task);
    }

    protected async search(task: ITASK) {
        this.log.log('begin search');
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
        const pickupStart = dateformat(task.criteria.pick_up_date, "yyyy-mm-dd'T'HH:MM:ss");
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
            // pickupEnd,
            mode: task.criteria.equipment.substr(0, 1).toUpperCase()
        };

        let searchQuery = '';
        Object.keys(search).forEach((key) => {
            searchQuery += `&${key}=${encodeURIComponent(search[key])}`;
        });
        const searchPage = this.host + '/find-loads/single?' + searchQuery.substr(1);
        this.log.log('searchPage', searchPage);

        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(searchPage, {
            timeout: waitingTimeout(),
            waitUntil: 'load'
        });

        await this.page
            .waitForSelector('.loading-indicator', {
                timeout: 10000,
                hidden: true
            })
            .catch((e) => {
                this.log.log('wait loading', e);
                throw new SiteError('logout', 'wait loading');
            });

        await this.page
            .waitForSelector('.data-table', {
                timeout: 20000
            })
            .catch((e) => {
                this.log.log('wait for data-table');
                throw new SiteError('noData', 'no data');
            });

        const resultHtml = await this.page.$eval('.data-table', (res) => res.outerHTML);
        const $ = cheerio.load(resultHtml);
        const resultData = this.getDataFromHtml($, task.task_id);

        const detailNumbers = resultData.map((item) => item['loadNumber']) as Array<string>;
        for (let i = 0, len = detailNumbers.length; i < len; i++) {
            const detailData = await this.goToDetailPage(detailNumbers[i]);
            const { pickUpData, dropOffData, requirementData, contactData } = detailData;
            const item = resultData[i];
            item['pickUpData'] = pickUpData;
            item['dropOffData'] = dropOffData;
            item['requirementData'] = requirementData;
            item['contactData'] = contactData;
        }

        this.log.log('resultData', ModifyPostData(task, resultData));
        await PostSearchData(ModifyPostData(task, resultData)).then((res: any) => {
            this.log.log(res.data);
        });
    }

    private async goToDetailPage(id: string): Promise<any> {
        this.log.log('goToDetailPage', id);
        const page = await this.browser.newPage();
        await page.setViewport(viewPort);
        await page.setUserAgent(userAgent);
        await page.goto(`https://www.navispherecarrier.com/find-load-details/${id}`);
        await page
            .waitForSelector('.loading-indicator', {
                timeout: 10000,
                hidden: true
            })
            .catch((e) => {
                this.pageScreenshot(page, `goToDetailPage${id}`);
                if (e instanceof TimeoutError) {
                    this.log.log('goToDetailPage timeout:', e);
                } else {
                    this.log.log('goToDetailPage:', e);
                    throw new SiteError('search', 'goToDetailPage wait loading');
                }
            });
        const $ = cheerio.load(await page.content());
        await page.close();
        return this.getDetailDataFromHtml($);
    }

    private getDetailDataFromHtml($: CheerioStatic): any {
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
                    dateTime,
                    location,
                    driverWork,
                    weight,
                    distance
                };
            } else {
                dropOffData = {
                    dateTime,
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

        return { pickUpData, dropOffData, requirementData, contactData };
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
                dropOff,
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
                dropOff,
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
