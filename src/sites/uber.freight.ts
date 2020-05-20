import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { SiteStack, DetailPage } from '../tools/siteStack';
import { SiteError } from '../error';

export class UberFreight extends SearchSite {
    public static siteName = 'Uber Freight';
    protected debugPre = 'Uber Freight';
    protected loginPage = 'https://auth.uber.com/login/session';
    protected searchPage = 'https://www.uberfreight.com/freight/carriers/fleet/search-loads/#_';

    protected async login(task: ITASK) {
        // input email
        await this.page.waitFor('#useridInput', { timeout: 10000 });
        await this.page.type('#useridInput', task.email);
        await this.page.click('form.push--top-small button');

        // input password
        await this.page.waitForSelector('#password', { timeout: 10000 });
        await this.page.type('#password', task.password);
        await this.page.click('form.push--top-small button');
        
        this.log.log('waiting logining')
        await this.page.waitForNavigation({timeout: 10000})
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
        this.page.click(
            '[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"] button:not(:disabled)'
        );

        await this.page
            .waitForSelector('a[data-testid="load-table-row"]', {
                timeout: 10000
            })
            .catch((e) => {
                throw this.generateError('noData', 'no data');
            });
        await this.getDataFromHtml(task);
    }

    private async getDataFromHtml(task: ITASK) {
        const linksAndData = await this.page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[data-testid="load-table-row"]')).map(
                (item) => {
                    const link = (item as HTMLLinkElement).href;
                    const deadhead = item.querySelector('[role="gridcell"]:nth-child(8)')
                        .textContent;
                    return { link, data: { deadhead } };
                }
            );
        });

        this.log.log('links', linksAndData);

        const detailPages = linksAndData.map((item) => {
            return new UberDetailPage(item.link, this.browser, item.data);
        })

        const siteStack = new SiteStack(
            detailPages,
            5,
            async (result) => {
                await PostSearchData(ModifyPostData(task, result)).then((res: any) => {
                    this.log.log(res.data);
                });
            }
        );

        await siteStack.search()
    }
}

class UberDetailPage extends DetailPage {
    protected debugPre = 'UberDetailPage'
    protected async search(): Promise<IResultHTMLData> {
        await this.page
            .waitForSelector('section[data-baseweb="card"]', { timeout: 10000 })
            .catch((e) => {
                throw new SiteError(
                    'search',
                    'UberDetailPage waitForSelector section[data-baseweb="card"]'
                );
            });
        const result = await this.page
            .evaluate(() => {
                const cards = Array.from(document.querySelectorAll('section[data-baseweb="card"]'));

                let result = {};
                let pickData = {};
                let dropOffData = {};
                let bookData = {};

                {
                    const pickupSection = cards[0];
                    const itemEls = Array.from(
                        pickupSection.querySelectorAll('[data-baseweb=flex-grid-item]')
                    );
                    const locationEl = itemEls[0];
                    const origin = locationEl.querySelector('[data-baseweb=typo-paragraphmedium]')
                        ?.textContent;
                    const pickUpLocation = locationEl.querySelector(
                        '[data-baseweb=typo-paragraphsmall]:last-child'
                    )?.textContent;

                    const timeEl = itemEls[1];
                    const date = timeEl.querySelector('[data-baseweb="typo-paragraphmedium"]')
                        ?.textContent;
                    const pickUpTime = timeEl.querySelector(
                        '[data-baseweb=typo-paragraphsmall]:last-child'
                    )?.textContent;

                    const facilityOwner = itemEls[2].querySelector(
                        '[data-baseweb="typo-paragraphmedium"]'
                    )?.textContent;
                    const pickUpNotes = pickupSection.querySelector(
                        '[data-baseweb="flex-grid"] + [data-baseweb="block"] [data-baseweb="typo-paragraphmedium"]'
                    )?.textContent;

                    pickData = {
                        origin,
                        pickUpLocation,
                        date,
                        pickUpTime,
                        facilityOwner,
                        pickUpNotes
                    };
                }

                {
                    const dropOffSection = cards[1];
                    const itemEls = Array.from(
                        dropOffSection.querySelectorAll('[data-baseweb=flex-grid-item]')
                    );
                    const destEl = itemEls[0];
                    const destination = destEl.querySelector('[data-baseweb=typo-paragraphmedium]')
                        ?.textContent;
                    const destLocation = destEl.querySelector(
                        '[data-baseweb=typo-paragraphsmall]:last-child'
                    )?.textContent;

                    const timeEl = itemEls[1];
                    const dropOffDate = timeEl.querySelector(
                        '[data-baseweb="typo-paragraphmedium"]'
                    )?.textContent;
                    const dropOffTime = timeEl.querySelector(
                        '[data-baseweb=typo-paragraphsmall]:last-child'
                    )?.textContent;

                    const facilityOwner = itemEls[2].querySelector(
                        '[data-baseweb="typo-paragraphmedium"]'
                    )?.textContent;
                    const dropOffNotes = dropOffSection.querySelector(
                        '[data-baseweb="flex-grid"] + [data-baseweb="block"] [data-baseweb="typo-paragraphmedium"]'
                    )?.textContent;

                    dropOffData = {
                        destination,
                        destLocation,
                        dropOffDate,
                        dropOffTime,
                        facilityOwner,
                        dropOffNotes
                    };
                }

                {
                    const bookInfo = cards[cards.length - 1];
                    const price = bookInfo.querySelector('h1')?.textContent;
                    const bookInfoDate = bookInfo.querySelector(
                        '[data-baseweb="typo-paragraphmedium"]'
                    )?.textContent;
                    const items = Array.from(
                        bookInfo.querySelectorAll(
                            '[data-baseweb="flex-grid"] [data-baseweb="flex-grid-item"]'
                        )
                    );
                    const [
                        equipment,
                        commodity,
                        weight,
                        packagingType,
                        ratePerMile,
                        distance,
                        loadId,
                        specialAttention
                    ] = items.map(
                        (item) =>
                            item.querySelector('[data-baseweb="typo-paragraphmedium"]')?.textContent
                    );

                    bookData = {
                        price,
                        bookInfoDate,
                        equipment,
                        commodity,
                        weight,
                        packagingType,
                        ratePerMile,
                        distance,
                        loadId,
                        specialAttention
                    };
                }

                result = {
                    ...pickData,
                    ...dropOffData,
                    ...bookData,
                    origin_radius: '',
                    destination_radius: ''
                };
                return result;
            })
            .catch((e:Error) => {
                throw new SiteError('search', 'UberDetailPage: ' + e.message)
            });
            this.log.log(result['date'], result['pickUpTime'])
            result['date'] = dateformat((result['date'] as string).replace(/(\d{2})(\w{2})/, '\$1') + " " + (new Date()).getFullYear() + " " + result['pickUpTime'], 'yyyy-mm-dd HH:MM');
        return result as IResultHTMLData;
    }
}
