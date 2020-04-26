import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData } from '../tools/index';
import { Log } from '../tools/log'
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';

export class WWWJbhuntCom extends SearchSite {
  public static siteName = 'JB Hunt 360'
  private log: Log = new Log('www.jbhunt.com')
  private searchPage = 'https://www.jbhunt.com/loadboard/load-board/map';

  public async login(task: ITASK) {

  }

  public async search(task: ITASK) {
    try {
      this.page = await this.browser.newPage();
      this.page.setDefaultNavigationTimeout(0);
      await this.page.setViewport(viewPort);
      await this.page.setUserAgent(userAgent);
      await this.page.goto(this.searchPage, {
        timeout: waitingTimeout()
      });

      this.page.on('close', (e) => {
        this.log.log('close page', e)
      })

      await this.page.click('p-dropdown[formcontrolname="equipmentType"]');
      await this.page.waitFor(500);
      await this.page.click('[role="option"][aria-label="Dry Van"]');

      await this.page.evaluate((criteria) => {
        const orignInput = document.querySelector('.header-container [formcontrolname=origin] input') as HTMLInputElement
        orignInput.value = criteria.origin

        const dhoInput = document.querySelector('.header-container input[formcontrolname="deadheadOrigin"]') as HTMLInputElement
        dhoInput.value = criteria.origin_radius

        const destInput = document.querySelector('.header-container [formcontrolname=destination] input') as HTMLInputElement
        destInput.value = criteria.destination

        const dhdInput = document.querySelector('.header-container input[formcontrolname="deadheadDestination"]') as HTMLInputElement
        dhdInput.value = criteria.destination_radius

      }, task.criteria)

      await this.page.click('.search-button')

    } catch (e) {
      if (e instanceof SiteError && e.type === 'logout') {
        await this.addUserToLogoutList(task)
        await this.notifyLoginFaild(task)
      }
      this.log.log(e)
    }
  }
}