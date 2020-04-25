import { SearchSite } from './search.site';
import puppeteer from 'puppeteer';
import dateformat from 'dateformat';
import cheerio from 'cheerio';
import { Trim, ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';

export class EchodriveEchoCom extends SearchSite {
    private loginPage = 'https://echodrive.echo.com/v2/login';
    private searchPage = 'https://echodrive.echo.com/v2/carrier/3275/availableLoads';
    private page: puppeteer.Page;

    public async login(task: ITASK) {
        try {
            console.log('EchodriveEchoCom  begin prepare');
            this.page = await this.browser.newPage();
            await this.page.goto(this.loginPage);
            await this.page.type('#email-input', task.email);
            await this.page.type('#password-input', task.password);
            await Promise.all([
                new Promise((resove) => {
                    this.browser.on('targetchanged', () => {
                        resove();
                    });
                }),
                this.page.click('#loading-button-component')
            ]);
            await this.removeUserFromLogoutList(task);
        } catch (e) {
            await this.addUserToLogoutList(task);
            console.log('EchodriveEchoCom  prepare error', e);
        }
    }

    public async search(task: ITASK) {
        try {
            this.page = await this.browser.newPage();
            await this.page.goto(this.searchPage);
            await this.page.waitForSelector('.search-btn', {
                timeout: 5000
            });
            console.log('EchodriveEchoCom  EchodriveEchoCom search');
            await this.page.type('.origin-input input', task.criteria.origin);
            await this.page.type('.dho-input input', task.criteria.origin_radius);
            await this.page.type('.destination-input input', task.criteria.destination);
            await this.page.type('.dhd-input input', task.criteria.destination_radius);
            // Apr 22 - 25
            await this.page.type(
                '.date-input input',
                dateformat(task.criteria.pick_up_date, 'mmm-dd')
            );
            await this.page.click('.search-btn');
            await this.page.waitForSelector('.available-loads-row');
            const resultHtml = await this.page.$eval(
                '.loads-bids-container',
                (res) => res.innerHTML
            );
            const $ = cheerio.load(resultHtml);
            PostSearchData(this.getDataFromHtml($, task.task_id)).then((res: any) => {
                console.log('EchodriveEchoCom', res.data);
            });
        } catch (e) {
            console.log('EchodriveEchoCom **** catched ****', e);
        }
    }

    public async closePage() {
        await this.page.close();
    }

    private getDataFromHtml($: CheerioStatic, taskID: string): Array<IResultData> {
        const result: any = {};

        const dataItemClass = [
            '.origin',
            ['.origin-dh', 'origin_radius'],
            '.destination',
            ['.destination-dh', 'destination_radius'],
            '.loaded-miles',
            '.weight',
            '.equipment'
        ];

        const resultItemRows = $('available-loads-results-row .app-card').map((key, element) => {
            console.info(key);
            const resultItem: any = {};
            dataItemClass.forEach((item) => {
                let key: string;
                let selector: string;
                if (Array.isArray(item)) {
                    [selector, key] = item;
                } else {
                    key = item.substr(1);
                    selector = item;
                }
                resultItem[key] = Trim($(element).find(selector).text());
            });
            return resultItem;
        });

        const resultItemDetails = $('available-loads-results-detail .column.info').map(
            (key, element) => {
                const resultItem: any = {};
                console.info(key);
                $(element)
                    .find('.row')
                    .each((key, row) => {
                        const $row = $(row);
                        resultItem[Trim($row.find('.title').text())] = Trim(
                            $row.find('.details').text()
                        );
                    });
                return resultItem;
            }
        );

        const records = [];
        for (let i = 0, len = resultItemRows.length; i < len; i++) {
            records.push({ ...resultItemRows[i], ...resultItemDetails[i] });
        }

        return ModifyPostData(taskID, records);
    }
}
