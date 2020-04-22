import { SearchSite } from './search.site';
import { account } from '../account';
import puppeteer from 'puppeteer';

export class EchodriveEchoCom extends SearchSite {
    private url = 'https://echodrive.echo.com/';
    private searchPage = 'https://echodrive.echo.com/v2/carrier/3275/availableLoads';
    private name: string = account['echodrive.echo.com'].name;
    private password: string = account['echodrive.echo.com'].password;
    private page: puppeteer.Page;

    public async prePare() {
        try {
            console.log('EchodriveEchoCom  begin prePare');
            this.page = await this.browser.newPage();
            await this.page.goto(this.url);
            await this.page.type('#username', this.name);
            await this.page.type('#password', this.password);
            this.page.click('button#login');
            await this.page.waitForNavigation();
            await this.page.goto(this.searchPage);
        } catch (e) {
            console.log('EchodriveEchoCom  prepare error');
        }
    }

    public async search(task: ITASK) {
      console.log('EchodriveEchoCom  EchodriveEchoCom search')
    }
}
