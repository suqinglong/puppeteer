import { SingletonTedis } from './tools/tedis'
import puppeteer from 'puppeteer';

async function memoryTest() {
  console.log('memoryTest begin')
  const r = SingletonTedis.getInstance()
  const browserWSEndpoints = await r.keys('*:browser_ws_endpoint')

  console.log('browserWSEndpoints:', browserWSEndpoints)

  for (let item of browserWSEndpoints) {
    try {
      const endPoint = String(await r.get(item))
      console.log('connecting:', item, endPoint)
      const browser = await puppeteer.connect({ browserWSEndpoint: endPoint });
      console.log('connect end:', item)
      const pages = await browser.pages()
      console.log('*********** browser: ', item, 'pages length: ', pages.length)
      pages.forEach(page => {
        console.log('*********** page url:', page.url())
      })
    } catch (e) {
      console.log('error:', e)
    }
  }

  console.log('memoryTest end\n\n\n')
}

setInterval(() => {
  memoryTest()
}, 5000)
