import { SearchSite } from './search.site';
import { account } from '../account';
import puppeteer from 'puppeteer';
import dateformat from 'dateformat';
import cheerio from 'cheerio';
import { Trim, ModifyPostData } from '../tools/index';
import { Post } from '../api';

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
      await this.page.waitForSelector('.search-btn', {
        timeout: 5000
      });
    } catch (e) {
      console.log('EchodriveEchoCom  prepare error', e);
    }
  }

  public async search(task: ITASK) {
    console.log('EchodriveEchoCom  EchodriveEchoCom search')
    await this.page.type('.origin-input input', task.criteria.origin)
    await this.page.type('.dho-input input', task.criteria.origin_radius)
    await this.page.type('.destination-input input', task.criteria.destination)
    await this.page.type('.dhd-input input', task.criteria.destination_radius)
    // Apr 22 - 25
    await this.page.type('.date-input input', dateformat(task.criteria.pick_up_date, 'mmm-dd'))
    await this.page.click('.search-btn')
    await this.page.waitForSelector('.available-loads-row')
    const resultHtml = await this.page.$eval(".loads-bids-container", (res) => res.innerHTML)
    const $ = cheerio.load(resultHtml)
    Post(this.getDataFromHtml($, task.task_id)).then((res: any) => {
      console.log('EchodriveEchoCom', res.data);
    });
  }

  private getDataFromHtml($: CheerioStatic, taskID: string): Array<IResultData> {
    const result: any = {};

    const dataItemClass = [
      '.origin',
      ['.origin-dh', 'origin_radius'],
      '.destination',
      ['.destination-dh', 'destination_radius'],
      '.loaded-miles',
      '.weight',
      '.equipment'
    ]

    const resultItemRows = $('available-loads-results-row .app-card').map((key, element) => {
      console.info(key)
      const resultItem: any = {};
      dataItemClass.forEach((item) => {
        let key: string;
        let selector: string;
        if (Array.isArray(item)) {
          [selector, key] = item;
        } else {
          key = item.substr(1);
          selector = item;
        }
        resultItem[key] = Trim($(element).find(selector).text());
      });
      return resultItem
    });

    const resultItemDetails = $('available-loads-results-detail .column.info').map((key, element) => {
      const resultItem: any = {};
      console.info(key)
      $(element).find('.row').each((key, row) => {
        const $row = $(row)
        resultItem[Trim($row.find('.title').text())] = Trim($row.find('.details').text())
      })
      return resultItem
    })

    const records = []
    for (let i = 0, len = resultItemRows.length; i < len; i++) {
      records.push({ ...resultItemRows[i], ...resultItemDetails[i] })
    }

    return ModifyPostData(taskID, records)
  }
}
