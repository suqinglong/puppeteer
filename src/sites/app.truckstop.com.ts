import puppeteer from 'puppeteer'

export class appTruckstopSite {
  url:string = 'https://app.truckstop.com'
  // url:string = 'https://www.baidu.com/'
  name:string = 'primelinkexpress@live.com'
  password:string = 'Navy825@'
  page: puppeteer.Page
  browser: puppeteer.Browser

  constructor(browser: puppeteer.Browser) {
    this.browser = browser;
  }

  async prePare() {
    console.log('begin new page')
    this.page = await this.browser.newPage();
    console.log('new page created')
    await this.login()
  }

  async login() {
    await this.page.goto(this.url);
    await this.page.waitForNavigation();
    console.log('login page loaded')
    this.page.type('#username', this.name);
    this.page.type('#password', this.password);
    this.page.click('input.loginBtn');

    // await this.page.waitForNavigation();
    const html = await this.page.content();
    console.log(html)
  }
}