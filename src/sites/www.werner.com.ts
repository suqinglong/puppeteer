import cheerio from 'cheerio';
import { SearchSite } from './searchSite';

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
            this.page.waitForSelector('#avail_loads_table .dataTables_empty').then(() => 'noData').catch(() => {
                this.log.log('waitfor no data')
            }),
            this.page.waitForSelector('#avail_loads_table tr[role="row"]').then(() => 'haveData').catch(() => {
                this.log.log('waitfor have data')
            })
        ]).then((raceResult) => {
            if (raceResult === 'noData') {
                this.log.log('There is no data');
                throw this.generateError('noData', 'There is no data');
            }
        })

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

        await this.postData(task, this.getDataFromHtml($))
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
                date: pickup,
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
        return result;
    }
}
