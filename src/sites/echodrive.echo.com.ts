import { SearchSite } from './search.site';
import { account } from '../account';
import puppeteer from 'puppeteer';

export class EchodriveEchoCom extends SearchSite {
    private url = 'https://echodrive.echo.com/v2/login';
    private searchPage = 'https://echodrive.echo.com/v2/carrier/3275/availableLoads';
    private name: string = account['echodrive.echo.com'].name;
    private password: string = account['echodrive.echo.com'].password;
    private page: puppeteer.Page;

    public async prePare() {
        try {
            console.log('EchodriveEchoCom  begin prePare');
            this.page = await this.browser.newPage();
            await this.page.goto(this.url);
            await this.page.type('#email-input', this.name);
            await this.page.type('#password-input', this.password);
            this.page.click('#loading-button-component');
            await this.page.waitForNavigation();
            await this.page.goto(this.searchPage);
        } catch (e) {
            console.log('EchodriveEchoCom  prepare error', e);
        }
    }

    public async search(task: ITASK) {
      console.log('EchodriveEchoCom  EchodriveEchoCom search')
    }
}
