import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { ModifyPostData, getRadiusFromValues } from '../tools/index';
import { PostSearchData } from '../api';

export class TQL extends SearchSite {
    public static siteName = 'TQL';
    protected debugPre = 'TQL';
    protected searchPage = 'https://carrierdashboard.tql.com/#/LoadSearch';

    protected async search(task: ITASK) {
        // select origin state, city
        const [originCity, originState] = task.criteria.origin
            .split(',')
            .map((item) => item.trim());
        await this.page
            .waitForSelector('#oStates', {
                timeout: 20000
            })
            .catch(() => {
                throw this.generateError('search', 'wait for selector oStates');
            });

        this.log.log('select origin state');
        const originStateValue = await this.page.evaluate((originState) => {
            let value = '';
            document.querySelectorAll('#oStates option').forEach((element) => {
                if ((element as HTMLElement).innerText === originState) {
                    value = (element as HTMLOptionElement).value;
                }
            });
            return value;
        }, originState);
        console.log('originStateValue');
        await this.page.select('#oStates', originStateValue);
        await this.page.waitFor(1000);
        // select city
        this.log.log('select origin city', originCity);
        await this.page.type('#ocities', originCity, { delay: 100 });
        // wait for popup tip
        const originCities = await this.page.$$('#SLoCities ul li');
        if (originCities.length >= 1) {
            await originCities[0].click();
        } else {
            throw this.generateError('search', 'no origin city match');
        }

        // origin radius
        // 25, 50, 75, 100, 150, 200, 250, 300
        this.log.log('select origin radius');
        const radiusValues = [25, 50, 75, 100, 150, 200, 250, 300];
        const originRadius = getRadiusFromValues(Number(task.criteria.origin_radius), radiusValues);
        const originRadiusValue = await this.page.evaluate((originRadius) => {
            let value = '';
            document.querySelectorAll('#orgRadius option').forEach((element) => {
                if ((element as HTMLElement).innerText === originRadius) {
                    value = (element as HTMLInputElement).value;
                }
            });
            return value;
        }, String(originRadius));
        await this.page.select('#orgRadius', originRadiusValue);

        // destination
        this.log.log('select origin destination state');
        const [destCity, destState] = task.criteria.destination
            .split(',')
            .map((item) => item.trim());

        await this.page.waitForSelector('#dStates');
        const destinationStateValue = await this.page.evaluate((destState) => {
            let value = '';
            document.querySelectorAll('#dStates option').forEach((element) => {
                if ((element as HTMLElement).innerText === destState) {
                    value = (element as HTMLInputElement).value;
                }
            });
            return value;
        }, destState);
        await this.page.select('#dStates', destinationStateValue);
        await this.page.waitFor(1000);
        this.log.log('select origin destination city');
        await this.page.type('#dcities', destCity, { delay: 100 });
        let destinationCities = await this.page.$$('#SLdCities ul li');
        if (destinationCities.length >= 1) {
            await destinationCities[0].click();
        } else {
            throw this.generateError('search', 'no dest city match');
        }

        // dest radius
        const destinationRadius = getRadiusFromValues(
            Number(task.criteria.destination_radius),
            radiusValues
        );
        const destRadiusValue = await this.page.evaluate((destinationRadius) => {
            let value = '';
            document.querySelectorAll('#destRadius option').forEach((element) => {
                if ((element as HTMLElement).innerText === destinationRadius) {
                    value = (element as HTMLInputElement).value;
                }
            });
            return value;
        }, String(destinationRadius));
        await this.page.select('#destRadius', destRadiusValue);

        // equipment
        this.log.log('select origin equipment');
        await this.page.waitForSelector('#TrailerTypes');
        await this.page.select(
            '#TrailerTypes',
            { Van: '2', Reefer: '1' }[task.criteria.equipment] || '0'
        ); // 0 是 All 1 是 Reefer 2 是 Van

        // date
        this.log.log('select origin date');
        await this.page.waitForSelector('#datepicker');
        await this.page.type('#datepicker', dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy'));

        // click search button
        this.log.log('click search button');
        await this.page.evaluate(() => {
            let btn: HTMLElement = document.querySelector('#SLSrchBtn') as HTMLElement;
            btn.click();
        });

        this.log.log('waitForResponse');
        let st;
        const response = await new Promise((resolve, reject) => {
            this.page.on('response', (resp) => {
                if (
                    resp.url() ===
                        'https://lmservicesext.tql.com/carrierdashboard.web/api/SearchLoads/SearchAvailableLoadsByState' &&
                    resp.request().method() === 'POST'
                ) {
                    clearTimeout(st);
                    resolve(resp);
                }
            });
            st = setTimeout(() => {
                reject(this.generateError('search', 'wait for response'));
            }, 10000);
        }).catch(() => {
            throw this.generateError('search', 'wait for response');
        });

        const responseData = await (response as Response).json();
        this.log.log('waitForResponse done');
        await PostSearchData(
            ModifyPostData(task, this.getDataFromResponse(responseData['PostedLoads']))
        ).then((res: any) => {
            this.log.log(res?.data);
        });
    }

    private getDataFromResponse(data: Array<any>): Array<IResultHTMLData> {
        const result: Array<IResultHTMLData> = data.map((item) => {
            return {
                postId: item.PostIdReferenceNumber,
                date: dateformat(item.LoadDate, 'mm/dd/yyyy'),
                origin_radius: item.OriginDistance,
                origin: [item.Origin.City, item.Origin.StateCode].join(', '),
                destination: [item.Destination.City, item.Destination.StateCode].join(', '),
                destination_radius: item.DestinationDistance,
                distance: item.Miles,
                equipment: (item.TrailerType && item.TrailerType.TrailerType) || '',
                dropDate: item.DeliveryDate,
                trailerSize: (item.TrailerSize && item.TrailerSize.TrailerSize) || '',
                weight: item.Weight,
                mode: item.Mode,
                comments: ''
            };
        });
        return result;
    }
}
