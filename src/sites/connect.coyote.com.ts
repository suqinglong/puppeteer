import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData, Trim, createUrl } from '../tools/index';
import { Log } from '../tools/log'
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';
import dateformat from 'dateformat'

export class ConnectCoyoteCom extends SearchSite {
  public static siteName = 'Coyote'
  public siteName = 'Coyote'
  private loginPage = 'https://api.coyote.com/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fauthority%3Dhttps%253A%252F%252Fapi.coyote.com%26client_id%3Dcoyote_connect_client%26redirect_uri%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%26response_type%3Did_token%2520token%26scope%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%2520openid%26post_logout_redirect_uri%3Dhttps%253A%252F%252Fconnect.coyote.com%252F%26acr_values%26state%3D%252F%26nonce%3Dhttps%253A%252F%252Fconnect.coyote.com'
  private log: Log = new Log('connect.coyote.com')

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

    await this.page.type('#Username', task.email).catch(e => {
      this.log.log('type Username', e)
    })

    await this.page.type('#password', task.password).catch(e => {
      this.log.log('type Password', e)
    })

    await Promise.all([
      this.page.waitForNavigation({
        timeout: 20000,
        waitUntil: 'load'
      }),
      this.page.click('#login-form-submit')
    ]).then(() => {
      this.log.log('login in success')
    }).catch(e => {
      this.log.log('login in error', e)
      throw new SiteError('logout', 'login in error')
    })

    await this.screenshot('endlogin')
  } catch(e) {
      await this.screenshot('loginerror')
      await this.addUserToLogoutList(task);
      await this.notifyLoginFaild(task);
      this.log.log('login error', e);
  }
  }

  public async search(task: ITASK) {
    // "https://connect.coyote.com/available-loads-v3?DDH=100&ODH=100&applyPreferredEquipmentTypeSearch=false&destination=Hamilton, OH&equipmentType=van&fromDate=04/28/2020&includeHiddenLoads=false&isMapViewEnabled=false&pageNumber=1&salt=1588048456061&savedLoadsOnly=false&sortColumnName=pickup date&toDate=05/05/2020"
    const search = {
      DDH: '',
      ODH: '',
      applyPreferredEquipmentTypeSearch: 'false',
      destination: '',
      equipmentType: '',
      fromDate: '',
    }
  }
}