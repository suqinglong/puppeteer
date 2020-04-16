import puppeteer from 'puppeteer'
import { PowerDataComSite } from "./sites/power.dat.com";
import memory from "./tools/memory";
// import cheerio from 'cheerio'

// const $ = cheerio.load('<div><span><a class="test">aa</a></span><span><a>bb</a></span></div>')

// const html = Array.from($('span')).map((item: any) => {
//   return $(item).find('a.test').html();
// })

// console.log(html)

// puppeteer.launch({
//   // executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
//   // devtools: false,
//   // headless: false,
//   // defaultViewport: {
//   //   width: 1200,
//   //   height: 800
//   // }

//   args: [
//     'no-sandbox',
//     'disable-setuid-sandbox',
//   ]
// }).then(async (browser: any) => {
//   const site = new PowerDataComSite(browser)
//   await site.prePare();
//   await site.doTask();
// });

// setInterval(() => {
//   console.log(memory.memory());
// }, 1000)