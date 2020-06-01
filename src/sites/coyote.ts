import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { createUrl } from '../tools/index';

export class Coyote extends SearchSite {
    public static siteName = 'Coyote';
    public debugPre = 'Coyote';
    protected loginPage =
        'https://api.coyote.com/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fauthority%3Dhttps%253A%252F%252Fapi.coyote.com%26client_id%3Dcoyote_connect_client%26redirect_uri%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%26response_type%3Did_token%2520token%26scope%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%2520openid%26post_logout_redirect_uri%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%26acr_values%26state%3D%252F%26nonce%3Dhttps%253A%252F%252Fconnect.coyote.com';
    protected searchPage: string;
    private searchResolve: Function;
    private isSearchEnd = false;

    protected async shouldLogin(): Promise<boolean> {
        const whichPage = await Promise.race([
            this.page.waitForSelector('#export-to-excel').then(() => 'searchPage'),
            this.page.waitForSelector('#Username').then(() => 'loginPage')
        ]);
        return whichPage === 'loginPage';
    }

    protected async login(task: ITASK) {
        await this.page.waitForSelector('#Username', {
            timeout: 10000
        });

        this.log.log('find #Username');

        await this.page.type('#Username', task.email).catch((e) => {
            this.log.log('type Username', e);
        });

        await this.page.type('#password', task.password).catch((e) => {
            this.log.log('type Password', e);
        });

        await this.page.waitForSelector('#login-form-submit', {
            timeout: 10000
        });
        await this.page.click('#login-form-submit');

        await this.page.waitForSelector('#header-user-region', {
            timeout: 60000
        });
    }

    protected async beforeSearch(task: ITASK) {
        // "https://connect.coyote.com/available-loads-v3"
        // ?DDH=100&ODH=100&applyPreferredEquipmentTypeSearch=false&destination=Easley%2C%20SC&equipmentType=van&fromDate=05%2F06%2F2020&includeHiddenLoads=false&isMapViewEnabled=false&origin=Easley%2C%20SC&pageNumber=1&pickupApptFromDate=05%2F06%2F2020&pickupApptToDate=05%2F13%2F2020&salt=1588747616092&savedLoadsOnly=false&sortColumnName=pickup%20date&toDate=06%2F17%2F2020
        const search = {
            DDH: task.criteria.origin_radius,
            ODH: task.criteria.destination_radius,
            destination: task.criteria.destination,
            equipmentType: task.criteria.equipment.toLowerCase(), // reefer, van
            origin: task.criteria.origin,
            fromDate: dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy'), // 05/13/2020
            toDate: '',
            pageNumber: 1,
            applyPreferredEquipmentTypeSearch: 'false',
            includeHiddenLoads: false,
            isMapViewEnabled: false,
            savedLoadsOnly: false,
            sortColumnName: 'pickup date'
        };

        this.searchPage = createUrl('https://connect.coyote.com/available-loads-v3', search);
        await super.beforeSearch(task);
    }

    protected async search(task: ITASK) {
        await new Promise((resolve) => {
            this.searchResolve = resolve;
        });
    }

    protected async afterPageCreated(task: ITASK) {
        this.page.on('response', async (res) => {
            if (this.isSearchEnd) return;
            if (res.url().match('Coyote.Client.WebApi/v2/loadsearch/availableloads')) {
                const dataJson: any = await res.json();
                const url = res.url();
                if (dataJson) {
                    this.log.log('dataJson.pagination', dataJson.pagination, 'url', url);
                    const limit = dataJson.pagination.limit as number;
                    const totalCount = dataJson.pagination.totalCount as number;
                    const offset = dataJson.pagination.offset as number;

                    await this.postDataFromResponse(task, dataJson.loads).then(() => {
                        if (totalCount <= limit + offset) {
                            this.isSearchEnd = true;
                            this.searchResolve && this.searchResolve(true);
                        } else {
                            const nextPageUrl = url
                                .replace(/offset=(\d+)/, `offset=${limit + offset}`)
                                .replace(/limit=(\d+)/, `limit=${limit}`);
                            this.page.evaluate((nextPageUrl) => {
                                const $ = window['$'];
                                $.ajax(nextPageUrl);
                            }, nextPageUrl);
                        }
                    });
                }
            }
        });
    }

    private async postDataFromResponse(task: ITASK, data: Array<{ [key: string]: any }>) {
        const result: Array<IResultHTMLData> = data.map((item) => {
            return {
                date: item.stops[0].scheduleOpenTime,
                equipment: item.equipmentType,
                origin: [item.originCityName, item.originStateCode].join(', '),
                origin_radius: item.originDeadHeadInMiles,
                destination: [item.destinationCityName, item.destinationStateCode].join(', '),
                destination_radius: item.destinationDeadHeadInMiles,
                distance: item.miles,
                weight: item.totalWeight,
                loadId: item.loadId,
                stops: item.stops.length
            };
        });

        await this.postData(task, result);
    }
}
