import puppeteer from 'puppeteer';

puppeteer.launch({
    headless: true,
    args: ['--disable-gpu'],
    ignoreDefaultArgs: ['--enable-automation'],
    defaultViewport: {
        width: 1920,
        height: 1080
    },
    dumpio: false
}).then(async browser => {

    const loginUrl = 'https://www.navispherecarrier.com/login';

    const page = await browser.newPage();

    page.once('load', () => console.log('Page loaded!'));

    await page.goto(loginUrl, {waitUntil: 'load'});


    //await page.screenshot({path: 'screenshot.png'});

    let title = await page.title();
    console.log('title:' + title);
    console.log('url:' + page.url());


    const username = 'ajgtransportllc';
    const password = 'Loaded2020!';

    await page.waitForSelector('#Username');
    await page.type('#Username', username);

    await page.waitForSelector('#Password');
    await page.type('#Password', password);

    await page.waitForSelector('#btnLogin');
    //await page.click('#btnLogin'); // doesn't work
    // await page.$eval('#btnLogin', elem => elem.click()); // works
    await page.evaluate(() => {
        let btn: HTMLElement = document.querySelector('#btnLogin') as HTMLElement;
        btn.click();
    });

    await page.waitForSelector('div.find-loads', {timeout: 10000});
    console.log('登录成功.');

    title = await page.title();
    console.log('title:' + title);
    console.log('url:' + page.url());

    await browser.close();
    console.log('done');

});
