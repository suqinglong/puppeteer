import cheerio from 'cheerio';
import { SearchSite } from './search.site';
import { SiteError } from '../error';
import { ModifyPostData, Trim } from '../tools/index';
import { Log } from '../tools/log'
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';
import dateformat from 'dateformat'
import { TimeoutError } from 'puppeteer/Errors';

export class WernerCom extends SearchSite {
  public needLogin = false;

  public static siteName = 'WernerCom'
  protected siteName = 'WernerCom'
  private log: Log = new Log('www.werner.com')
  private loginPage = '';
  private host = 'https://www.navispherecarrier.com'
  
  public async login(task: ITASK) {
    // 不需要登录
  }

  public async search(task: ITASK) {

    this.page = await this.browser.newPage();

    await this.page.setViewport(viewPort);
    await this.page.setUserAgent(userAgent);

    const searchPage = 'http://www.werner.com/content/carriers/available_loads/';

    await this.page.goto(searchPage, {
      timeout: 10000,
      waitUntil: 'load'
    });

    await this.page.waitForSelector('#OriginState');
    // todo 从 task.criteria.origin 取
    await this.page.select('#OriginState', 'CA');

    await this.page.waitForSelector('#DestinState');
    // todo 从 task.criteria.destination 取
    await this.page.select('#DestinState', 'OR');

    await this.page.waitForSelector('#avail_loads_table');
    let content = await this.page.evaluate(() => {
      return document.querySelector('#avail_loads_table').outerHTML
    });
    console.log(content);

    //const $ = cheerio.load(content);
    //console.log('从 table 里面拿数据');

    let records = [];

    $('tbody tr').each((_index, item) => {

      $(item).find('td').each((k, v) => {

        console.log(k);
        console.log($(v).text());

        // todo 判断 pickup date 是否满足条件
        // todo 判断 equipment 是否满足条件
        // 算了,不判断了
      });


      const tds = $(item).find('td');

      // task_id
      const taskID = task.task_id;

      // date
      const d = Date.parse($(tds[6]).text());
      const dateFormated = dateformat(new Date(d), 'yyyy-mm-dd HH:MM');

      // source
      const source = 'Werner';

      // equipment
      const equipment = $(tds[5]).text();

      // origin
      const origin = $(tds[0]).text() + ',' + $(tds[1]).text();

      // origin_radius
      const origin_radius = '';

      // destination
      const destination = $(tds[2]).text() + ',' + $(tds[3]).text();

      // destination_radius
      const destination_radius = '';

      // distance
      const distance = $(tds[4]).text();

      // extra
      const extra = new Map();
      extra.set('pickup', $(tds[6])).text();
      extra.set('contact number', $(tds[7]).text());
      extra.set('region', $(tds[8]).text());
      
      records.push({
        'task_id':taskID,
        'date': dateFormated,
        'source': source,
        'equipment': equipment,
        'origin': origin,
        'origin_radius': origin_radius,
        'destination': destination,
        'destination_radius': destination_radius,
        'distance': distance,
        'extra': JSON.stringify(extra)
      });

      console.log("\n");
    });

    // 调用内部接口,保存 records
    // todo records 是个 array, 不能直接使用 PostSearchData,如何是好。。
  }
}
