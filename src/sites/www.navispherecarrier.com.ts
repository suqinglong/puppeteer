import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { Log } from '../tools/log'
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';

export class NavispherecarrierCom extends SearchSite {
  public static siteName = 'Navisphere'
  private log: Log = new Log('www.navispherecarrier.com')
  private loginPage = 'https://www.navispherecarrier.com/login';

  public async login(task: ITASK) {
    try {
      this.log.log('login begin')
      this.page = await this.browser.newPage();
      await this.page.setViewport(viewPort);
      await this.page.setUserAgent(userAgent);
      await this.page.goto(this.loginPage, { timeout: waitingTimeout() });
      this.log.log('login page loaded')
      const modalCloseButton = await this.page.waitForSelector('#top-close-btn').catch(e => {
        this.log.log('waitForSelector modalCloseButton', e)
      })
      // if (modalCloseButton) {
      //   modalCloseButton.click()
      // }
      // this.page.waitForSelector('#Username').catch(e => {
      //   this.log.log('waitForSelector Username', e)
      // })
      // await this.page.type('#Username', task.email).catch(e => {
      //   this.log.log('type Username', e)
      // })
      // await this.page.type('#Password', task.password).catch(e => {
      //   this.log.log('type Password', e)
      // })
      // await Promise.all([
      //   new Promise((resove) => {
      //     let st = setTimeout(() => {
      //       resove()
      //     }, 3000)
      //     this.browser.on('targetchanged', () => {
      //       clearTimeout(st)
      //       resove();
      //     });
      //   }),
      //   this.page.click('#btnLogin').catch(e => {
      //     this.log.log('click btnLogin', e)
      //   })
      // ]);
      // this.log.log('login success')
    } catch (e) {
      await this.screenshot()
      // await this.addUserToLogoutList(task);
      // await this.notifyLoginFaild(task);
      this.log.log('login error', e);
    }
  }

  public async search(task: ITASK) {
  }
}