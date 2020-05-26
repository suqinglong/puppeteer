import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { ModifyPostData, getRadiusFromValues } from '../tools/index';
import { PostSearchData } from '../api';
import cheerio from 'cheerio';

export class Landstar extends SearchSite {
    public static siteName = 'Landstar';
    protected debugPre = 'Landstar';
    protected loginPage = 'http://www.landstaronline.com/public/login.aspx';
    protected searchPage = 'http://www.landstaronline.com/loads';

    protected async login(task: ITASK) {
        // 用户名
        await this.page.waitForSelector('#USER');
        await this.page.type('#USER', task.email);

        // 密码
        await this.page.waitForSelector('#PASSWORD');
        await this.page.type('#PASSWORD', task.password);

        // 点击登录
        // 点击登录后,触发跳转,会跳转几次,最终会跳转到 http://spportal.landstaronline.com/
        await this.page.waitForSelector('#Submit');
        await this.page.click('#Submit');

        await this.page.waitForSelector('#dashboard', { timeout: 10000 });
    }

    protected async search(task: ITASK) {
        const page = this.page;
        // origin radius
        await page.waitForSelector('#OriginRadius');
        await page.select(
            '#OriginRadius',
            String(
                getRadiusFromValues(Number(task.criteria.origin_radius), [
                    0,
                    25,
                    50,
                    75,
                    100,
                    150,
                    200,
                    250,
                    300,
                    350,
                    400,
                    450,
                    500
                ])
            )
        ); // 可选值:0, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500

        // destination radius
        await page.waitForSelector('#DestinationRadius');
        await page.select(
            '#DestinationRadius',
            String(
                getRadiusFromValues(Number(task.criteria.destination_radius), [
                    0,
                    25,
                    50,
                    75,
                    100,
                    150,
                    200,
                    250,
                    300,
                    350,
                    400,
                    450,
                    500
                ])
            )
        );

        // 限制只搜索美国,不搜索加拿大
        await page.waitForSelector('#OriginRestrictResults');
        await page.select('#OriginRestrictResults', 'US');

        await page.waitForSelector('#DestinationRestrictResults');
        await page.select('#DestinationRestrictResults', 'US');

        // pickup start date
        await page.waitForSelector('#PickupDateStart');
        await page.type('#PickupDateStart', dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy'));

        // origin
        await page.waitForSelector('#TxtOriginControl');
        await page.type('#TxtOriginControl', task.criteria.origin.toUpperCase() + ', US');
        // 此时会出现智能提示
        await page.waitForSelector('#ui-id-1 li', { timeout: 5000 });
        let originOptions = await page.$$('#ui-id-1 li');
        let originOptionIndex = await page.evaluate((v) => {
            return Array.from(document.querySelectorAll('#ui-id-1 li')).findIndex(
                (item) => item.textContent.indexOf(v) > -1
            );
        }, task.criteria.origin.toUpperCase() + ', US');
        if (originOptionIndex > -1) {
            await originOptions[originOptionIndex].click();
        } else if (originOptions.length > 0) {
            await originOptions[0].click();
        } else {
            throw this.generateError('search', 'no origin matched');
        }

        // destination
        await page.waitForSelector('#TxtDestinationControl');
        await page.type('#TxtDestinationControl', task.criteria.destination.toUpperCase() + ', US');
        // 此时会出现智能提示
        await page.waitForSelector('#ui-id-2 li', { timeout: 5000 });
        let destinationOptions = await page.$$('#ui-id-2 li');
        let destinationOptionIndex = await page.evaluate((v) => {
            return Array.from(document.querySelectorAll('#ui-id-1 li')).findIndex(
                (item) => item.textContent.indexOf(v) > -1
            );
        }, task.criteria.destination.toUpperCase() + ', US');

        if (destinationOptionIndex > -1) {
            await destinationOptions[destinationOptionIndex].click();
        } else if (destinationOptions.length > 0) {
            await destinationOptions[0].click();
        } else {
            throw this.generateError('search', 'no destination matched');
        }

        // 选择 equipment
        const search_equipment = task.criteria.equipment.toUpperCase(); // 可选的值是 VAN 和 REFR ,注意不是 REEFER
        await page.evaluate((search_equipment) => {
            const i = document.querySelector('#ddArrowTrailerTypes') as HTMLElement;
            i.click();
            document
                .querySelectorAll('#treeDivmultiSelectTrailerTypes > ul>li')
                .forEach((element) => {
                    const name = (element.querySelector('div span.k-in') as HTMLElement).innerText;
                    if (name === search_equipment) {
                        const checkbox = element.querySelector(
                            'div span.k-checkbox input'
                        ) as HTMLElement;
                        checkbox.click();
                    }
                });
            i.click();
        }, search_equipment);

        await page.waitForSelector('#searchButton');
        await page.evaluate(() => {
            let btn: HTMLElement = document.querySelector('#searchButton') as HTMLElement;
            btn.click();
        });

        await page.waitForSelector('#ResultsTabs', { timeout: 5000 }).catch((e) => {
            throw this.generateError('noData', 'no data ResultsTabs timeout');
        });

        const resultHtml = await page.$eval('div#Loads', (e) => e.outerHTML);
        const $ = cheerio.load(resultHtml);
        if ($('tbody tr').length === 1) {
            throw this.generateError('noData', 'no data');
        }

        await PostSearchData(ModifyPostData(task, this.getDataFromHtml($))).then((res: any) => {
            this.log.log(res?.data);
        });
    }

    private getDataFromHtml($: CheerioStatic): Array<IResultHTMLData> {
        const result: Array<IResultHTMLData> = [];
        $('tbody tr.t-master-row').each((_index, _item) => {
            const tds = $(_item).find('td');

            let t = $(tds[2]).text().trim().split('\n');
            const agency = t[0].trim();
            const contact = t[1].trim();

            t = $(tds[3]).text().trim().split('\n');
            let date = t[0].trim(); // 05/21/20 12:30 05/21/20 12:30
            const dateMatch = date.match(/\d{2}\/\d{2}\/\d{2}\s\d{2}:\d{2}/);
            if (dateMatch[0]) {
                date = dateMatch[0];
            }
            this.log.log('date:', date);
            const deliveryDate = t[1].trim();

            t = $(tds[4]).text().trim().split('\n');
            const origin = t[0].trim();
            const destination = t[2].trim();

            t = $(tds[5]).text().trim().split('\n');
            const origin_radius = t[0].trim();
            const destination_radius = t[1].trim();

            const equipment = $(tds[6]).text().trim();
            const distance = $(tds[8]).text().trim();

            t = $(tds[9]).text().trim().split('\n');
            const weight = t[0].trim();
            const weightType = t[1].trim();

            const cmdtyCode = $(tds[10]).text().trim();
            result.push({
                agency,
                contact,
                date,
                deliveryDate,
                origin,
                destination,
                origin_radius,
                destination_radius,
                equipment,
                distance,
                weight,
                weightType,
                cmdtyCode
            });
        });
        return result;
    }
}
