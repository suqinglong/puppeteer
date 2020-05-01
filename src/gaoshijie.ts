import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import dateformat from 'dateformat';

puppeteer
    .launch({
        headless: true,
        args: ['--disable-gpu'],
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        dumpio: false
    })
    .then(async (browser) => {
        // CH Robinson
        // const loginUrl = 'https://www.navispherecarrier.com/login';
        //
        // const page = await browser.newPage();
        //
        // page.once('load', () => console.log('Page loaded!'));
        //
        // await page.goto(loginUrl, {waitUntil: 'load'});
        //
        //
        // //await page.screenshot({path: 'screenshot.png'});
        //
        // let title = await page.title();
        // console.log('title:' + title);
        // console.log('url:' + page.url());
        //
        // const username = 'ajgtransportllc';
        // const password = 'Loaded2020!';
        //
        // await page.waitForSelector('#Username');
        // await page.type('#Username', username);
        //
        // await page.waitForSelector('#Password');
        // await page.type('#Password', password);
        //
        // await page.waitForSelector('#btnLogin');
        // //await page.click('#btnLogin'); // doesn't work
        // // await page.$eval('#btnLogin', elem => elem.click()); // works
        // await page.evaluate(() => {
        //     let btn: HTMLElement = document.querySelector('#btnLogin') as HTMLElement;
        //     btn.click();
        // });
        //
        // await page.waitForSelector('div.find-loads', {timeout: 10000});
        // console.log('登录成功.');
        //
        // title = await page.title();
        // console.log('title:' + title);
        // console.log('url:' + page.url());
        //
        // await browser.close();
        // console.log('done');

        // DAT
        // const loginUrl = 'https://power.dat.com/login';
        //
        // const page = await browser.newPage();
        //
        // page.once('load', () => console.log('Page loaded!'));
        //
        // await page.goto(loginUrl, {waitUntil: 'load'});
        //
        // let title = await page.title();
        // console.log('title:' + title);
        // console.log('url:' + page.url());
        //
        // const username = 'haulistix';
        // const password = 'Shostakovich5';
        //
        // await page.waitForSelector('#username');
        // await page.type('#username', username);
        //
        // await page.waitForSelector('#password');
        // await page.type('#password', password);
        //
        // await page.waitForSelector('#login');
        // // await page.click('#btnLogin'); // doesn't work
        // // await page.$eval('#btnLogin', elem => elem.click()); // works
        // await page.evaluate(() => {
        //     let btn: HTMLElement = document.querySelector('#login') as HTMLElement;
        //     btn.click();
        // });
        //
        // await page.waitForSelector('li.carriers, a.search', {timeout: 10000});
        // console.log('登录成功.');
        //
        // title = await page.title();
        // console.log('title:' + title);
        // console.log('url:' + page.url());

        // await browser.close();
        // console.log('done');

        // werner
        const page = await browser.newPage();

        page.once('load', () => console.log('Page loaded!'));

        const url = 'http://www.werner.com/content/carriers/available_loads/';

        await page.goto(url, { waitUntil: 'load' });

        await page.waitForSelector('#OriginState');
        await page.select('#OriginState', 'CA');

        await page.waitForSelector('#DestinState');
        await page.select('#DestinState', 'OR');

        await page.waitForSelector('#avail_loads_table');
        let content = await page.evaluate(() => {
            return document.querySelector('#avail_loads_table').outerHTML;
        });
        console.log(content);

        const $ = cheerio.load(content);
        console.log('从 table 里面拿数据');

        // console.log($('tbody tr').length);

        $('tbody tr').each((_index, item) => {
            // $(item).find('td').each((k, v) => {
            //
            //     console.log(k);
            //     console.log($(v).text());
            //
            //     if (k == 6) {
            //         const time = '1588242715'
            //
            //         const t = new Date( Number(time) * 1000 );
            //         console.log(t)
            //     }
            // });

            const tds = $(item).find('td');
            console.log($(tds[0]).text());

            console.log('\n');
        });

        await browser.close();
        console.log('done');
    });
