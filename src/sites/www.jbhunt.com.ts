import { SearchSite } from './searchSite';
import dateformat from 'dateformat'
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';

export class JBHunt extends SearchSite {
    public static siteName = 'JB Hunt';
    protected debugPre = 'JB Hunt';
    protected searchPage = 'https://www.jbhunt.com/loadboard/load-board/map';
    private searchAPI = 'https://scm.jbhunt.com/carrier/public/rest/loadboard/graphql/external'


    protected async search(task: ITASK) {
        this.log.log('search begin')
        await this.page.waitForSelector('.grouped-inputs:nth-child(1) p-autocomplete input[aria-autocomplete="list"]')

        // origin
        this.log.log('input origin')
        await this.page.type('.grouped-inputs:nth-child(1) p-autocomplete input[aria-autocomplete="list"]', task.criteria.origin, {
            delay: 10
        })
        await this.page.waitForSelector('.grouped-inputs:nth-child(1) .ui-autocomplete-items [role="option"]').catch(e => {
            throw this.generateError('search', 'no origin matched')
        })
        await this.page.click('.grouped-inputs:nth-child(1) .ui-autocomplete-items [role="option"]:nth-child(1)')
        await this.page.focus('.grouped-inputs:nth-child(1) [formcontrolname="deadheadOrigin"]')
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace')
        }
        await this.page.type('.grouped-inputs:nth-child(1) [formcontrolname="deadheadOrigin"]', task.criteria.origin_radius)

        // destination
        this.log.log('input destination')
        await this.page.type('.grouped-inputs:nth-child(2) p-autocomplete input[aria-autocomplete="list"]', task.criteria.destination, {
            delay: 10
        })
        await this.page.waitForSelector('.grouped-inputs:nth-child(2) .ui-autocomplete-items [role="option"]').catch(e => {
            throw this.generateError('search', 'no destination matched')
        })
        await this.page.click('.grouped-inputs:nth-child(2) .ui-autocomplete-items [role="option"]:nth-child(1)')
        await this.page.focus('.grouped-inputs:nth-child(2) [formcontrolname="deadheadDestination"]')
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Backspace')
        }
        await this.page.type('.grouped-inputs:nth-child(2) [formcontrolname="deadheadDestination"]', task.criteria.destination_radius)

        // equipment
        this.log.log('input equipment')
        await this.page.evaluate(() => {
            (document.querySelector('.loadboard-input p-dropdown[formcontrolname="equipmentType"] .ui-dropdown') as HTMLElement).click()
        })
        await this.page.waitForSelector('.loadboard-input .ui-dropdown-items')
        const equipmentOptionIndex = await this.page.evaluate((equipment) => {
            return Array.from(document.querySelectorAll('.loadboard-input .ui-dropdown-items p-dropdownitem')).findIndex(item => {
                return item.textContent.toLowerCase().indexOf(equipment) > -1
            })
        }, task.criteria.equipment.toLowerCase())
        await this.page.click(`.loadboard-input .ui-dropdown-items p-dropdownitem:nth-child(${equipmentOptionIndex + 1})`);

        await this.page.click('.search-button');
        const searchUrl = this.page.url().replace(/StartDate=\d{4}-\d{2}-\d{2}/, 'StartDate=' + dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy'))
        await this.page.goto(searchUrl, {
            waitUntil: 'domcontentloaded'
        })
        const response = await (await this.page.waitForResponse(this.searchAPI)).json() as any

        if (response?.data?.searchTripsElasticOptimized?.success) {
            const data = response.data.searchTripsElasticOptimized?.data?.loads
            await PostSearchData(
                ModifyPostData(task, this.getDataFromResponse(data))
            ).then((res: any) => {
                this.log.log(res.data);
            });
        }
    }

    private getDataFromResponse(data:Array<any>):Array<IResultHTMLData> {
        const result:Array<IResultHTMLData> = data.map(item => {
            return {
                date: item.firstPickupDate,
                equipment: item.equipment?.type,
                origin: [item.firstPickupLocation?.location?.city , item.firstPickupLocation?.location?.state].join(', '),
                origin_radius: item.deadheadOrigin + ' miles',
                destination: [item.lastDeliveryLocation?.location?.city , item.lastDeliveryLocation?.location?.state].join(', '),
                destination_radius: item.deadheadDestination + ' miles',
                distance: item.totalMiles,
                ... item
            }
        })
        return result
    }
}
