import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { PostSearchData } from '../api';
import { createUrl, xlsxParse, ModifyPostData } from '../tools/index';
import fs from 'fs';
import path from 'path';

export class Coyote extends SearchSite {
    public static siteName = 'Coyote';
    public debugPre = 'Coyote';
    protected loginPage =
        'https://api.coyote.com/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fauthority%3Dhttps%253A%252F%252Fapi.coyote.com%26client_id%3Dcoyote_connect_client%26redirect_uri%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%26response_type%3Did_token%2520token%26scope%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%2520openid%26post_logout_redirect_uri%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%26acr_values%26state%3D%252F%26nonce%3Dhttps%253A%252F%252Fconnect.coyote.com';
    protected searchPage;
    private downloadPath = `./download/Coyote`;

    protected async shouldLogin(): Promise<boolean> {
        const whichPage = await Promise.race([
            this.page.waitForSelector('#export-to-excel').then(() => 'searchPage').catch(e => {
                // console.log(e)
            }),
            this.page.waitForSelector('#Username').then(() => 'loginPage').catch(e => {
                // console.log(e)
            })
        ])
        return whichPage === 'loginPage'
    }

    protected async login(task: ITASK) {
        await this.page
            .waitForSelector('#Username', {
                timeout: 5000
            })
            .catch((e) => {
                this.log.log('waitForSelector Username', e);
            });

        this.log.log('find #Username');

        await this.page.type('#Username', task.email).catch((e) => {
            this.log.log('type Username', e);
        });

        await this.page.type('#password', task.password).catch((e) => {
            this.log.log('type Password', e);
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
        await super.beforeSearch(task)
    }

    protected async search(task: ITASK) {
        await (this.page as any)._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.downloadPath
        });

        await this.page.waitForSelector('#export-to-excel:not(:disabled)', {
            timeout: 10000
        });
        await this.page.evaluate(() => {
            (document.querySelector('#export-to-excel') as HTMLElement).click();
        });

        try {
            const files = fs.readdirSync(this.downloadPath);
            for (const file of files) {
                fs.unlinkSync(path.join(this.downloadPath, file));
            }
        } catch (e) {
            this.log.log('clean downloadpath', e);
        }

        await this.page.waitFor(20);
        const filePath = await new Promise((resolve) => {
            fs.watch(this.downloadPath, (eventType, filename) => {
                this.log.log('fs.watch', eventType, filename);
                if (filename === 'Available Loads Export.xlsx') {
                    resolve(path.join(this.downloadPath, filename));
                }
            });
        });
        if (filePath) {
            await PostSearchData(
                ModifyPostData(task, this.getDataFromXlsx(filePath as string))
            ).then((res: any) => {
                this.log.log(res.data);
            });
        }
    }

    private getDataFromXlsx(filePath: string): Array<IResultHTMLData> {
        const data = xlsxParse(filePath as string);
        const result = [];
        data.shift();
        data.forEach((item) => {
            const date =
                item[6] && item[6].match(/\d+\/\d+\/\d+/) && item[6].match(/\d+\/\d+\/\d+/)[0];
            const origin = [item[3], item[4]].join(', ');
            const origin_radius = 0;
            const destination_radius = 0;
            const destination = [item[7], item[8]].join(', ');

            result.push({
                date,
                origin,
                destination,
                origin_radius,
                destination_radius,
                'Load ID': item[0],
                Mode: item[1],
                equipment: item[2],
                // 'Shipper City Location': item[3],
                // 'Shipper State Location': item[4],
                // 'Shipper Country Code': item[5],
                'Pickup Date': item[6],
                // 'Consignee City Location': item[7],
                // 'Consignee State Location': item[8],
                // 'Consignee Country Code': item[9],
                'Delivery Date': item[10],
                Stops: item[11],
                dstance: item[12] + item[13],
                Weight: item[14] + item[15]
            });
        });
        return result;
    }
}
