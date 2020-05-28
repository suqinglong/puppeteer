import { SearchSite } from './searchSite';
import dateformat from 'dateformat';

export class UberFreight extends SearchSite {
    public static siteName = 'Uber Freight';
    protected debugPre = 'Uber Freight';
    protected loginPage = 'https://auth.uber.com/login/session';
    protected searchPage = 'https://www.uberfreight.com/freight/carriers/fleet/search-loads/';

    protected async login(task: ITASK) {
        // input email
        await this.page.waitFor('#useridInput', { timeout: 10000 });
        await this.page.type('#useridInput', task.email);
        await this.page.click('form.push--top-small button');

        // input password
        await this.page.waitForSelector('#password', { timeout: 10000 });
        await this.page.type('#password', task.password);
        await this.page.click('form.push--top-small button');

        this.log.log('waiting logining');
        await this.page.waitForNavigation({ timeout: 10000 });
    }

    protected async search(task: ITASK) {
        await this.page.waitForSelector(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]',
            {
                timeout: 10000
            }
        );
        await this.page.type(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(1) input',
            task.criteria.origin,
            { delay: 100 }
        );
        await this.page.waitForSelector(
            '[data-baseweb="popover"] ul[role="listbox"] li[role="option"]'
        );

        this.log.log('orgin');
        const origins = await this.page.$$(
            '[data-baseweb="popover"] ul[role="listbox"] li[role="option"]'
        );
        if (origins.length === 1) {
            await origins[0].click();
        }

        this.log.log('pick_up_date');
        await this.page.type(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(2) input',
            dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy')
        );
        await this.page.click('[data-baseweb="typo-labelsmall"]');

        this.log.log('Pickup end date');
        await this.page.type(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(5) input',
            dateformat(
                new Date(Number(new Date(task.criteria.pick_up_date)) + 24 * 3600 * 1000),
                'mm/dd/yyyy'
            )
        );
        await this.page.click('[data-baseweb="typo-labelsmall"]');

        this.log.log('origin_radius');
        await this.page.focus(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(3) input'
        );
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        await this.page.type(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(3) input',
            String(Math.min(450, Number(task.criteria.origin_radius)))
        );

        this.log.log('destination');
        await this.page.type(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(4) input',
            task.criteria.destination,
            { delay: 100 }
        );
        await this.page.waitForSelector(
            '[data-baseweb="popover"] ul[role="listbox"] li[role="option"]'
        );
        const dests = await this.page.$$(
            '[data-baseweb="popover"] ul[role="listbox"] li[role="option"]'
        );
        if (dests.length === 1) {
            await dests[0].click();
        }

        this.log.log('destination_radius');
        await this.page.focus(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(6) input'
        );
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace');
        }
        await this.page.type(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(6) input',
            String(Math.min(450, Number(task.criteria.destination_radius)))
        );

        this.log.log('equipment');
        await this.page.click(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(7) [data-baseweb="select"]'
        );
        await this.page.waitForSelector(
            '[data-baseweb="popover"] ul[role="listbox"] li[role="option"]'
        );
        const selectedIndex = await this.page.evaluate((eqiupment) => {
            return Array.from(
                document.querySelectorAll(
                    '[data-baseweb="popover"] ul[role="listbox"] li[role="option"]'
                )
            ).findIndex((item) => {
                return item && item.textContent.indexOf(eqiupment) > -1;
            });
        }, task.criteria.equipment);

        if (selectedIndex > -1) {
            await this.page.click(
                `[data-baseweb="popover"] ul[role="listbox"] li[role="option"]:nth-child(${
                    selectedIndex + 1
                })`
            );
        }

        await this.page.waitForSelector(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"] button:not(:disabled)'
        );

        let searchResolve;
        let isSendRequest = false;
        this.page.on('response', async (res) => {
            if (res.url().match('/freight/carriers/fleet/api/getSearchJobPage')) {
                const data: Array<any> = ((await res.json()) as any).data.jobs;
                if (data && data.length > 0) {
                    await this.postData(
                        task,
                        data.map((item: any) => this.getDataFromResponse(item))
                    );
                }
                searchResolve();
            }
        });

        this.page.on('request', (req) => {
            if (req.url().match('/freight/carriers/fleet/api/getSearchJobPage')) {
                isSendRequest = true;
            }
        });

        await this.page.click(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"] button:not(:disabled)'
        );

        setTimeout(() => {
            if (!isSendRequest) {
                searchResolve();
                throw this.generateError('search', 'no request send');
            }
        }, 1000);

        await new Promise((resolve) => {
            searchResolve = resolve;
        });
    }

    private getDataFromResponse(data: any): IResultHTMLData {
        let originPoint = data?.waypoints?.[0];
        let destPoint = data?.waypoints?.[1];
        let task0 = originPoint?.tasks?.[0];
        let items = task0?.DEPRECATED_purchaseOrderTask?.purchaseOrder?.items;
        return {
            date: originPoint?.appointStartTime?.epoch,
            origin: originPoint?.locationText,
            origin_radius: data?.formattedMeasurements?.deadHead,
            destination_radius: '',
            destination: destPoint?.locationText,
            rate: data?.formattedMeasurements?.price,
            ratePerDistance: data?.formattedMeasurements?.ratePerDistance,
            weight: data?.formattedMeasurements?.weight,
            distance: data?.formattedMeasurements?.distance,
            loadId: data?.jobID,
            equipment: data?.trailerType,
            packagingType:
                task0?.DEPRECATED_purchaseOrderTask?.purchaseOrder?.packageCount +
                ' ' +
                task0?.DEPRECATED_purchaseOrderTask?.purchaseOrder?.packaging,
            commodity: items?.[0]?.name,
            dropoffTime:
                destPoint?.appointEndTime?.epoch + ' ' + destPoint?.appointEndTime?.timeZone,
            originLocationDetail: originPoint?.businessFacility?.facilityProfile?.formattedAddress,
            destinationLocationDetail:
                destPoint?.businessFacility?.facilityProfile?.formattedAddress,
            orginFacilityOwner: originPoint?.businessFacility?.business?.name,
            destinationFacilityOwner: destPoint?.businessFacility?.business?.name,
            specialAttention: data?.formattedMeasurements?.specialAttention || '',
            pickUpNote: originPoint?.note,
            dropoffNote: destPoint?.note,
            status: data?.status
        };
    }
}
