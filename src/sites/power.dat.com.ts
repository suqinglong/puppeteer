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

      console.log($item.find('td.age').text(), $item.find('.age').text())

      const age = $item.find('.age').text()
      const avail = $item.find('.avail').text()
      const truck = $item.find('.truck').text()
      const fp  = $item.find('.fp').text()
      const DO  = $item.find('.do').text()
      const origin  = $item.find('.origin').text()
      const trip  = $item.find('.trip a').text()
      const dest  = $item.find('.dest').text()
      const dd   = $item.find('.dd ').text()
      const company  = $item.find('.company a').text()
      const length   = $item.find('.length ').text()

      const contact  = $item.find('.contact').text()
      const weight   = $item.find('.weight ').text()
      const cs  = $item.find('.cs a').text()
      const dtp  = $item.find('.dtp a').text()
      const factorable  = $item.find('.factorable').text()
      const rate  = $item.find('.rate').text()

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
