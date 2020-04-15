import puppeteer from 'puppeteer'
import { Tedis } from "tedis";
import { account } from '../account';

const tedis = new Tedis({
  host: "127.0.0.1",
  port: 6379
});

export class PowerDataComSite {
  url: string = 'https://power.dat.com/'
  searchPage: string = 'https://power.dat.com/search/loads'
  name: string = account["power.dat.com"].name
  password: string = account["power.dat.com"].password
  page: puppeteer.Page
  browser: puppeteer.Browser

  infoKeys = [
    "age", 
    "pickup", 
    "Truck", 
    "fp", 
    "DH-O", 
    "orgin", 
    "trip", 
    "destination", 
    "DH-D", 
    "company", 
    "contact", 
    "length",
    "weight",
    "CS",
    "DTP",
    "Factor",
    "Rate"
  ]

  constructor(browser: puppeteer.Browser) {
    this.browser = browser;
  }

  async prePare() {
    console.log('begin new page')
    this.page = await this.browser.newPage();
    this.page.setDefaultNavigationTimeout(0);
    console.log('new page created')
    let num = 0;
    setInterval(() => {
      console.log(num++)
    }, 1000)

    await this.page.goto(this.url);
    console.log('login page loaded')
    await this.page.type('#username', this.name);

    await this.page.type('#password', this.password);

    this.page.click('button#login');
    await this.page.waitForNavigation();

    await this.page.goto(this.searchPage);
    console.log('search page loaded')

    await this.page.waitForSelector('.newSearch', {
      timeout: 0
    })
  }

  private async search(task: ITASK) {
    const addSearchButton = await this.page.$('.newSearch')
    const searchValueDisabled = await this.page.$eval('.newSearch', el => el.getAttribute('disabled'));
    if (searchValueDisabled !== 'disabled') {
      addSearchButton.click();
    }
    await this.page.waitForSelector('.main-data .origin > input', { timeout: 0 });
    console.log('origin:', task.criteria.origin)
    await this.page.type('.main-data .origin > input', task.criteria.origin)
    console.log('destination:', task.criteria.destination)
    await this.page.type('.main-data .dest > input', task.criteria.destination)

    await this.page.type('.main-data .dho > input', task.criteria.origin_radius)
    await this.page.type('.main-data .dhd > input', task.criteria.destination_radius)

    this.page.click('button.search')

    await this.page.waitForSelector('.resultItem', {
      timeout: 0
    })
    const html = await this.page.$$eval('.resultItem', options => options.map(option => {
      return (option as HTMLElement).innerText
    }))

    console.log(html)
  }

  async doTask() {
    const taskResult = (await tedis.blpop(0, "search_tasks"))[1]
    console.log('taskResult', taskResult)
    if (taskResult) {
      const task: ITASK = JSON.parse(taskResult) as ITASK
      this.search(task)
    }
  }
}
