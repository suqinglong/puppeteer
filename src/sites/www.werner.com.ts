import cheerio from 'cheerio';
import { SearchSite } from './search.site';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { userAgent, viewPort } from '../settings';
import dateformat from 'dateformat';

export class WwwWernerCom extends SearchSite {
    public static siteName = 'Werner';
    public needLogin = false;
    protected debugPre = 'Werner';
    private searchPage = 'http://65.247.121.34/content/carriers/available_loads/';

    protected async search(task: ITASK) {
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);

        await this.page.goto(this.searchPage, {
            timeout: 40000,
            waitUntil: 'load'
        });

        await this.page.waitForSelector('#OriginState');
        const [, originState] = task.criteria.origin.split(',').map((item) => item.trim());
        await this.page.select('#OriginState', originState);

        await this.page.waitForSelector('#DestinState');
        const [, destState] = task.criteria.origin.split(',').map((item) => item.trim());
        await this.page.select('#DestinState', destState);

        await Promise.race([
            this.page.waitForSelector('#avail_loads_table .dataTables_empty').then(() => 'noData'),
            (await this.page.waitForSelector('#avail_loads_table tr[role="row"]')).evaluateHandle(
                () => 'haveData'
            )
        ])
            .then((raceResult) => {
                if (raceResult === 'noData') {
                    this.log.log('There is no data');
                    this.generateError('noData', 'There is no data');
                }
            })
            .catch((e) => {
                this.log.log('Promise race error', e);
                this.generateError('search', 'Promise race error');
            });

        // expend all child
        await this.page.evaluate(() => {
            document.querySelectorAll('#avail_loads_table .min-phone-l').forEach((item, _key) => {
                (item as HTMLElement).click();
            });
        });
        await this.page.waitFor(200);
        await this.screenshot('search data done');

        const content = await this.page.evaluate(() => {
            return document.querySelector('#avail_loads_table').outerHTML;
        });
        this.log.log('result html', content);
        const $ = cheerio.load(content);

        await PostSearchData(ModifyPostData(task, this.getDataFromHtml($))).then((res: any) => {
            this.log.log(res.data);
        });
    }

    private getDataFromHtml($: CheerioStatic): Array<IResultHTMLData> {
        const result: Array<IResultHTMLData> = [];
        const parentItems = $('tbody tr.parent');

        parentItems.each((_number, element) => {
            const $element = $(element);
            const childTr = $(element).next('tr.child');
            let [
                originCity,
                originState,
                destCity,
                destState,
                miles,
                equipment,
                pickup,
                contactMember,
                region
            ] = Array.from($element.find('td')).map((el) => $(el).text());
            let [stops, reference] = Array.from(childTr.find('.dtr-data')).map((el) =>
                $(el).text()
            );
            result.push({
                date: dateformat(new Date(Date.parse(pickup)), 'yyyy-mm-dd HH:MM'),
                equipment,
                origin: [originCity, originState].join(', '),
                origin_radius: '',
                destination: [destCity, destState].join(', '),
                destination_radius: '',
                distance: miles,
                contactMember,
                region,
                stops,
                reference
            });
        });
        this.log.log('result:', result);
        return result;
    }
}
