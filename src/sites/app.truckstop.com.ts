import puppeteer from 'puppeteer';

export class appTruckstopSite {
    public url = 'https://app.truckstop.com';
    public name = 'primelinkexpress@live.com';
    public password = 'Navy825@';
    public page: puppeteer.Page;
    public browser: puppeteer.Browser;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public async prePare() {
        console.log('begin new page');
        this.page = await this.browser.newPage();
        console.log('new page created');
        await this.login();
    }

    public async login() {
        await this.page.goto(this.url);
        await this.page.waitForNavigation();
        console.log('login page loaded');
        this.page.type('#username', this.name);
        this.page.type('#password', this.password);
        this.page.click('input.loginBtn');

        // await this.page.waitForNavigation();
        const html = await this.page.content();
        console.log(html);
    }
}
