import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { ModifyPostData, getRadiusFromValues } from '../tools/index';
import { PostSearchData } from '../api';

export class UberFreight extends SearchSite {
  public static siteName = 'Uber Freight';
  protected debugPre = 'Uber Freight';
  protected loginPage = 'https://auth.uber.com/login/session'
  protected searchPage = 'https://www.uberfreight.com/freight/carriers/fleet/search-loads/#_'

  protected async login(task: ITASK) {
    this.log.log('login loaded')

    // input email
    await this.page.waitFor('#useridInput', { timeout: 10000 })
    await this.page.type('#useridInput', task.email)
    await this.page.click('form.push--top-small button');

    // input password
    await this.page.waitForSelector('#password', { timeout: 10000 })
    await this.page.type('#password', task.password)
    await this.page.click('form.push--top-small button')

    await this.page.waitForSelector('.icon_profile.icon')

    this.log.log('login success')
  }

  protected async search(task: ITASK) {
    this.log.log('search page loaded')
    await this.page.waitForSelector('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]', {
      timeout: 10000
    })
    await this.page.type('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(1) input', task.criteria.origin, { delay: 100 })
    await this.page.waitForSelector('[data-baseweb="popover"] ul[role="listbox"] li[role="option"]')

    this.log.log('orgin')
    const origins = await this.page.$$('[data-baseweb="popover"] ul[role="listbox"] li[role="option"]');
    if (origins.length === 1) {
      await origins[0].click()
    }

    this.log.log('pick_up_date')
    await this.page.type('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(2) input', dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy'))
    await this.page.click('[data-baseweb="typo-labelsmall"]')

    this.log.log('origin_radius')
    await this.page.focus('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(3) input')
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('Backspace');
    }
    await this.page.type('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(3) input', String(Math.min(450, Number(task.criteria.origin_radius))))

    this.log.log('destination')
    await this.page.type('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(4) input', task.criteria.destination, { delay: 100 })
    await this.page.waitForSelector('[data-baseweb="popover"] ul[role="listbox"] li[role="option"]')
    const dests = await this.page.$$('[data-baseweb="popover"] ul[role="listbox"] li[role="option"]');
    if (dests.length === 1) {
      await dests[0].click()
    }

    this.log.log('destination_radius')
    await this.page.focus('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(6) input')
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('Backspace');
    }
    await this.page.type('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(6) input', String(Math.min(450, Number(task.criteria.destination_radius))))

    this.log.log('equipment')
    await this.page.click('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"]:nth-child(7) [data-baseweb="select"]')
    await this.page.waitForSelector('[data-baseweb="popover"] ul[role="listbox"] li[role="option"]')
    const selectedIndex = await this.page.evaluate((eqiupment) => {
      return Array.from(document.querySelectorAll('[data-baseweb="popover"] ul[role="listbox"] li[role="option"]')).findIndex(item => {
        return item.textContent.indexOf(eqiupment) > -1
      })

    }, task.criteria.equipment)

    if (selectedIndex > -1) {
      await this.page.click(`[data-baseweb="popover"] ul[role="listbox"] li[role="option"]:nth-child(${selectedIndex + 1})`)
    }

    await this.page.waitForSelector('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"] button:not(:disabled)')
    this.page.click('[data-baseweb=flex-grid] [data-baseweb="flex-grid-item"] button:not(:disabled)')
  }
}