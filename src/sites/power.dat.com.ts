import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { Tedis } from 'tedis';
import { account } from '../account';

const tedis = new Tedis({
    host: '127.0.0.1',
    port: 6379
});

export class PowerDataComSite {
    public url = 'https://power.dat.com/';
    public searchPage = 'https://power.dat.com/search/loads';
    public name: string = account['power.dat.com'].name;
    public password: string = account['power.dat.com'].password;
    public page: puppeteer.Page;
    public browser: puppeteer.Browser;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public async prePare() {
        console.log('begin new page');
        this.page = await this.browser.newPage();
        this.page.setDefaultNavigationTimeout(0);
        console.log('new page created');
        let num = 0;
        setInterval(() => {
            console.log(num++);
        }, 1000);

        await this.page.goto(this.url);
        console.log('login page loaded');
        await this.page.type('#username', this.name);

        await this.page.type('#password', this.password);

        this.page.click('button#login');
        await this.page.waitForNavigation();

        await this.page.goto(this.searchPage);
        console.log('search page loaded');

        await this.page.waitForSelector('.newSearch', {
            timeout: 0
        });
    }

    public async doTask() {
        const taskResult = (await tedis.blpop(0, 'search_tasks'))[1];
        // const taskResult = { "task_id": "ca7eb2b1c5c98467ae4809d95bdc5446", "site": "XPO Connect", "criteria": { "origin": "Kennewick, WA", "origin_radius": "100", "destination": "", "destination_radius": "100", "pick_up_date": "2020-04-18", "equipment": "Van" } }
        console.log('taskResult', taskResult);
        if (taskResult) {
            // const task: ITASK = taskResult as ITASK
            const task: ITASK = JSON.parse(taskResult) as ITASK;
            this.search(task);
        }
    }

    private async search(task: ITASK) {
        try {
            const addSearchButton = await this.page.$('.newSearch');
            const searchValueDisabled = await this.page.$eval('.newSearch', (el) =>
                el.getAttribute('disabled')
            );
            if (searchValueDisabled !== 'disabled') {
                addSearchButton.click();
                console.log('addSearchButton click');
            }
            await this.page.waitForSelector('.searchListTable .origin  input', { timeout: 0 });

            console.log('origin:', task.criteria.origin);
            if (task.criteria.origin) {
                await this.page.type('.searchListTable .origin  input', task.criteria.origin);
            }

            console.log('destination:', task.criteria.destination);
            if (task.criteria.destination) {
                await this.page.type('.searchListTable .dest  input', task.criteria.destination);
            }

            await this.page.type('.searchListTable .dho  input', task.criteria.origin_radius);
            await this.page.type('.searchListTable .dhd  input', task.criteria.destination_radius);

            await this.page.$eval('.searchListTable .avail input', (input) => {
                (input as HTMLInputElement).value = '';
            });

            const date = task.criteria.pick_up_date.substr(5).replace('-', '/');
            await this.page.type('.searchListTable .avail  input', date);

            this.page.click('button.search');
            console.log('click search button');

            await this.page.waitForSelector('.resultItem', {
                timeout: 0
            });

            const resultHtml = await this.page.content();
            const $ = cheerio.load(resultHtml);
            const items = Array.from($('.resultItem')).map((item: any) => {
                const $item = $(item);
                // console.log($item.html())
                const age = $item.find('.age').text();
                const avail = $item.find('.avail').text();
                const equipment = $item.find('.truck').text();
                const fp = $item.find('.fp').text();
                const origin_radius = $item.find('.do').text();
                const origin = $item.find('.origin').text();
                const trip = $item.find('.trip a').text();
                const destination = $item.find('.dest').text();
                const destination_radius = $item.find('.dd ').text();
                const company = $item.find('.company a').text();
                const length = $item.find('.length ').text();
                const contact = $item.find('.contact').text();
                const weight = $item.find('.weight ').text();
                const cs = $item.find('.cs a').text();
                const dtp = $item.find('.dtp a').text();

                return {
                    age,
                    avail,
                    equipment,
                    fp,
                    origin_radius,
                    origin,
                    trip,
                    destination,
                    destination_radius,
                    company,
                    contact,
                    length,
                    weight,
                    cs,
                    dtp
                };
            });

            axios
                .post('http://54.219.50.46:9501/api/internal/save_search_result', {
                    token: '6bbcbce7bc90c008',
                    records: items.map((item) => {
                        return {
                            task_id: task.task_id,
                            date: task.criteria.pick_up_date,
                            source: 'DAT',
                            equipment: item.equipment,
                            origin: item.origin,
                            origin_radius: item.origin_radius,
                            destination: item.destination,
                            destination_radius: item.destination_radius,
                            distance: '',
                            extra: JSON.stringify(item)
                        };
                    })
                })
                .then((res: any) => {
                    console.log(res.data);
                });

            console.log(items);
        } catch (e) {
            console.log(e);
        }
        await this.doTask();
    }
}
