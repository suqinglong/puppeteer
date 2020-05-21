import { SearchSite } from './searchSite';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';

export class Allenlund extends SearchSite {
    public static siteName = 'Allenlund';
    protected debugPre = 'Allenlund';
    protected loginPage = 'https://www.allenlund.com/';
    protected searchPage = 'https://www.allenlund.com/carriers/search-loads.php';

    protected async login(task: ITASK) {
        const page = this.page;
        // 用户名
        await page.waitForSelector('#login_user');
        await page.type('#login_user', task.email);

        // 密码
        await page.waitForSelector('input[name="login_pass"]');
        await page.type('input[name="login_pass"]', task.password);

        // 点击登录
        // 点击登录后,触发跳转,会跳转几次,最终会跳转到 http://spportal.landstaronline.com/
        await page.waitForSelector('input[type="submit"]');
        await page.click('input[type="submit"]');

        // 登录成功后,会跳转到 https://www.allenlund.com/carriers/carrier-profile.php 页面
        await page.waitForSelector('table.company-info', { timeout: 5000 });
    }

    protected async search(task: ITASK) {
        const page = this.page;
        // equipment
        await page.waitForSelector('select[name="equipment_type"]');
        await page.select(
            'select[name="equipment_type"]',
            task.criteria.equipment.substr(0, 1).toUpperCase()
        ); // V 表示 Van, R 表示 Reefer

        // origin city
        const [originCity, originState] = task.criteria.origin.split(',').map((item) => item.trim());
        await page.waitForSelector('input[name="city1"]');
        await page.type('input[name="city1"]', originCity); // 大小写不敏感

        // origin state
        await page.waitForSelector('input[name="state1"]');
        await page.type('input[name="state1"]', originState);

        // origin radius
        // 输入了这个就查询不出来结果了,可能是网站问题
        // await page.waitForSelector('input[name="radius1"]');
        // await page.type('input[name="radius1"]', '100');

        // destination city
        const [destinationCity, destinationState] = task.criteria.destination.split(',').map((item) => item.trim());
        await page.waitForSelector('input[name="city2"]');
        await page.type('input[name="city2"]', destinationCity); // 大小写不敏感

        // destination state
        await page.waitForSelector('input[name="state2"]');
        await page.type('input[name="state2"]', destinationState);

        // destination radius
        // 输入了这个就查询不出来结果了,可能是网站问题
        // await page.waitForSelector('input[name="radius2"]');
        // await page.type('input[name="radius2"]', '100');

        await page.waitForSelector('input[name="search"]');
        await page.click('input[name="search"]');

        await page.waitForSelector('div.tbl-margin table', { timeout: 5000 }).catch((e) => {
            throw this.generateError('noData', 'no data');
        });

        await page.waitFor(3000);

        const data = await this.getDataFromHtml();
        await PostSearchData(ModifyPostData(task, data)).then((res: any) => {
            this.log.log(res.data);
        });
    }

    private async getDataFromHtml(): Promise<Array<IResultHTMLData>> {
        const data: Array<IResultHTMLData> = await this.page.evaluate(() => {
            const result = [];
            const trs = Array.from(document.querySelectorAll('div.tbl-margin table tbody > tr'));

            console.log('trs', trs.length);

            trs.forEach((tr) => {
                let [
                    ,
                    postingId,
                    date,
                    equipment,
                    originCity,
                    originState,
                    destinationCity,
                    destinationState,
                    contact
                ] = Array.from(tr.querySelectorAll('td')).map(
                    (td) => (td as HTMLElement).textContent
                );
                if (contact && !tr.classList.contains('highlight-row')) {
                    console.log('date:', date, contact);
                    result.push({
                        postingId,
                        equipment,
                        date,
                        origin: [originCity, originState].join(', '),
                        destination: [destinationCity, destinationState].join(', '),
                        contact,
                        origin_radius: '',
                        destination_radius: '',
                        distance: ''
                    });
                }
            });
            return result;
        });
        return data;
    }
}
