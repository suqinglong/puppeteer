import cheerio from 'cheerio';
import { SearchSite } from './searchSite';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import dateformat from 'dateformat';
import { SiteError } from '../error';

export class Werner extends SearchSite {
    public static siteName = 'Werner';
    protected debugPre = 'Werner';
    protected searchPage = 'http://65.247.121.34/content/carriers/available_loads/';

    protected async search(task: ITASK) {
        await this.page.waitForSelector('#OriginState');
        const [, originState] = task.criteria.origin.split(',').map((item) => item.trim());
        await this.page.select('#OriginState', originState);

        await this.page.waitForSelector('#DestinState');
        const [, destState] = task.criteria.destination.split(',').map((item) => item.trim());
        await this.page.select('#DestinState', destState);

        await Promise.race([
            this.page.waitForSelector('#avail_loads_table .dataTables_empty').then(() => 'noData'),
            this.page.waitForSelector('#avail_loads_table tr[role="row"]').then(() => 'haveData')
        ])
            .then((raceResult) => {
                if (raceResult === 'noData') {
                    this.log.log('There is no data');
                    throw this.generateError('noData', 'There is no data');
                }
            })
            .catch((e) => {
                if (!(e instanceof SiteError)) {
                    this.log.log('Promise race error', e);
                    throw this.generateError('search', 'Promise race error');
                }
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
        const $ = cheerio.load(content);

        await PostSearchData(ModifyPostData(task, this.getDataFromHtml($))).then((res: any) => {
            this.log.log(res?.data);
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
                pickup,
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
