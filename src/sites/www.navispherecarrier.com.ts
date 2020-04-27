import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData, Trim } from '../tools/index';
import { Log } from '../tools/log'
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';
import dateformat from 'dateformat'

export class NavispherecarrierCom extends SearchSite {
  public static siteName = 'Navisphere'
  private log: Log = new Log('www.navispherecarrier.com')
  private loginPage = 'https://www.navispherecarrier.com/login';
  private host = 'https://www.navispherecarrier.com'

  public async login(task: ITASK) {
    try {
      this.log.log('login begin')
      this.page = await this.browser.newPage();
      await this.page.setViewport(viewPort);
      await this.page.setUserAgent(userAgent);
      await this.page.goto(this.loginPage, { timeout: waitingTimeout() });
      this.log.log('login page loaded')

      await this.page.waitForSelector('#Username', {
        timeout: 5000
      }).catch(e => {
        this.log.log('waitForSelector Username', e)
      })

      await this.page.click('body')
      await this.page.waitFor(500)

      await this.page.type('#Username', task.email).catch(e => {
        this.log.log('type Username', e)
      })

      await this.page.type('#Password', task.password).catch(e => {
        this.log.log('type Password', e)
      })

      await Promise.all([
        new Promise((resove) => {
          let st = setTimeout(() => {
            resove()
          }, 3000)
          this.browser.on('targetchanged', () => {
            clearTimeout(st)
            resove();
          });
        }),
        this.page.click('#btnLogin').catch(e => {
          this.log.log('click btnLogin', e)
        })
      ]);
      this.log.log('login success')
    } catch (e) {
      await this.screenshot(NavispherecarrierCom.siteName + '.loginerror')
      await this.addUserToLogoutList(task);
      await this.notifyLoginFaild(task);
      this.log.log('login error', e);
    }
  }

  public async search(task: ITASK) {
    // check task origin
    if (task.criteria.origin.indexOf(',') === -1 || task.criteria.destination.indexOf(',') === -1) {
      return
    }
    // origin: 'New York, NY',
    const [originCity, originStateProvinceCode] = task.criteria.origin.split(',').map(item => item.trim())
    const [destinationCity, destinationStateProvinceCode] = task.criteria.destination.split(',').map(item => item.trim())
    const [pickupStart, pickupEnd] = task.criteria.pick_up_date.split(',').map(item => dateformat(item, "yyyy-mm-dd'T'HH:MM:ss"))
    const search = {
      originCountryCode: 'US',
      originStateProvinceCode,
      originCity,
      originRadiusMiles: task.criteria.origin_radius,
      destinationCountryCode: 'US',
      // destinationStateProvinceCode,
      // destinationCity,
      destinationRadiusMiles: task.criteria.destination_radius,
      pickupStart,
      pickupEnd,
      mode: task.criteria.equipment.substr(0, 1).toUpperCase()
    }

    let searchQuery = ''
    Object.keys(search).forEach(key => {
      searchQuery += `&${key}=${encodeURIComponent(search[key])}`
    })
    const searchPage = this.host + '/find-loads/single?' + searchQuery.substr(1)
    this.log.log('searchPage', searchPage)

    this.page = await this.browser.newPage();
    await this.page.setViewport(viewPort);
    await this.page.setUserAgent(userAgent);
    await this.page.goto(searchPage, {
      timeout: waitingTimeout(),
      waitUntil: 'domcontentloaded'
    });
    this.log.log('search page loaded')

    await this.screenshot('search')
    await this.page.waitForSelector('select#page-size', {
      timeout: 20000
    })

    await this.screenshot('search5')

    // await this.page.select('select#page-size', '100')
    // await this.page.click('.refresh-button')
    // await this.screenshot('search1')
    // await this.page.waitForSelector('.loading-indicator', {
    //   timeout: 10000,
    //   hidden: true
    // })
    // await this.screenshot('search2')

    // await this.page.waitForSelector('.data-table', {
    //   timeout: 10000
    // })

    // const resultHtml = await this.page.$eval(
    //   '.data-table',
    //   (res) => res.innerHTML
    // );
    // const $ = cheerio.load(resultHtml);

    // this.getDataFromHtml($, task.task_id)
  }

  private getDataFromHtml($: CheerioStatic, taskID: string): Array<any> {
    console.log($.html())
    const result: any = {};
    $('tr').each((_index, item) => {
      const result = []
      $(item).find('td').each((_tdIndex, tdItem) => {
        result.push($(tdItem).text())
      })
      const [loadNumber, orgin, pickUp, originDeadhead, destination, dropOff, weight, distance, equipment, endorsement] = result
      result.push({ loadNumber, orgin, pickUp, originDeadhead, destination, dropOff, weight, distance, equipment, endorsement })
    })
    this.log.log('result', result)
    return result
  }
}