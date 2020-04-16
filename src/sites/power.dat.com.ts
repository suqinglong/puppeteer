import puppeteer from 'puppeteer'
import { Tedis } from "tedis";
import { account } from '../account';
import cheerio from 'cheerio'

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
    if (task.criteria.origin) {
      await this.page.type('.main-data .origin > input', task.criteria.origin)
    }

    console.log('destination:', task.criteria.destination)
    if (task.criteria.destination) {
      await this.page.type('.main-data .dest > input', task.criteria.destination)
    }

    await this.page.type('.main-data .dho > input', task.criteria.origin_radius)
    await this.page.type('.main-data .dhd > input', task.criteria.destination_radius)

    await this.page.type('.main-data .avail > input', task.criteria.pick_up_date.substr(5).replace('-', '/'))

    this.page.click('button.search')

    await this.page.waitForSelector('.resultItem', {
      timeout: 0
    })

    const resultHtml = await this.page.content()
    const $ = cheerio.load(resultHtml)
    const html = Array.from($('.resultItem')).map((item: any) => {
      const $item = $(item)

      const age = $item.find('td.age').textContent
      const avail = $item.find('td.avail').textContent
      const truck = $item.find('td.truck').textContent
      const fp  = $item.find('td.fp').textContent
      const DO  = $item.find('td.do').textContent
      const origin  = $item.find('td.origin').textContent
      const trip  = $item.find('td.trip a').textContent
      const dest  = $item.find('td.dest').textContent
      const dd   = $item.find('td.dd ').textContent
      const company  = $item.find('td.company a').textContent
      const length   = $item.find('td.length ').textContent

      const contact  = $item.find('td.contact').textContent
      const weight   = $item.find('td.weight ').textContent
      const cs  = $item.find('td.cs a').textContent
      const dtp  = $item.find('td.dtp a').textContent
      const factorable  = $item.find('td.factorable').textContent
      const rate  = $item.find('td.rate').textContent

      return {
        age, avail, truck, fp, DO, origin, trip, dest, dd, company, contact, length, weight, cs, dtp,
        factorable, rate
      }
    })

    console.log(html)
    await this.doTask()
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
