import { SingletonTedis } from '../tools/tedis';
import puppeteer from 'puppeteer';
import { settings } from '../settings';

async function memoryTest() {
    console.log('memoryTest begin');
    const r = SingletonTedis.getInstance();
    const browserWSEndpoints = await r.keys('*:browser_ws_endpoint');

    console.log('browserWSEndpoints:', browserWSEndpoints);

    for (let item of browserWSEndpoints) {
        try {
            const endPoint = String(await r.get(item));
            console.log('connecting:', item, endPoint);
            const browser = await puppeteer.connect({ browserWSEndpoint: endPoint });
            console.log('connect end:', item);
            const pages = await browser.pages();
            console.log('*********** browser: ', item, 'pages length: ', pages.length);
            pages.forEach(async (page) => {
                console.log('*********** page url:', page.url());
                const title = await page.title();
                screenshot(page, title.replace(/\s/g, '_') + '_memoryTest');
            });
        } catch (e) {
            console.log('error:', e);
        }
    }

    console.log('memoryTest end\n\n\n');
}

async function screenshot(page: puppeteer.Page, name: string) {
    await page.screenshot({
        path: `${settings.screenPath}${name}.png`,
        fullPage: true
    });
}

setInterval(() => {
    memoryTest();
}, 5000);
