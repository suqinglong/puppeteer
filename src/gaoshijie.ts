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

        // werner ======================================================
        // const page = await browser.newPage();
        //
        // page.once('load', () => console.log('Page loaded!'));
        //
        // const url = 'http://www.werner.com/content/carriers/available_loads/';
        //
        // await page.goto(url, { waitUntil: 'load' });
        //
        // await page.waitForSelector('#OriginState');
        // await page.select('#OriginState', 'CA');
        //
        // await page.waitForSelector('#DestinState');
        // await page.select('#DestinState', 'OR');
        //
        // await page.waitForSelector('#avail_loads_table');
        // let content = await page.evaluate(() => {
        //     return document.querySelector('#avail_loads_table').outerHTML;
        // });
        // console.log(content);
        //
        // const $ = cheerio.load(content);
        // console.log('从 table 里面拿数据');
        //
        // // console.log($('tbody tr').length);
        //
        // $('tbody tr').each((_index, item) => {
        //     // $(item).find('td').each((k, v) => {
        //     //
        //     //     console.log(k);
        //     //     console.log($(v).text());
        //     //
        //     //     if (k == 6) {
        //     //         const time = '1588242715'
        //     //
        //     //         const t = new Date( Number(time) * 1000 );
        //     //         console.log(t)
        //     //     }
        //     // });
        //
        //     const tds = $(item).find('td');
        //     console.log($(tds[0]).text());
        //
        //     console.log('\n');
        // });
        //
        // await browser.close();
        // console.log('done');



        // https://carrierdashboard.tql.com/#/LoadSearch ======================================================
        const page = await browser.newPage();

        page.once('load', () => console.log('搜索页面加载完成。'));

        page.on('requestfinished', request => {
            console.log('on request finished. url:' + request.url() + ' method: ' + request.method());
            if (request.url() == "https://lmservicesext.tql.com/carrierdashboard.web/api/SearchLoads/SearchAvailableLoadsByState") {
                console.log('post data:' + request.postData());
            }
        });

        const url = 'https://carrierdashboard.tql.com/#/LoadSearch';

        await page.goto(url, { waitUntil: 'load' });

        // 页面加载完成后,需要等一段时间,让 ajax 完成。
        // https://lmservicesext.tql.com/carrierdashboard.web/api/Location/GetAllCities 这个ajax耗时挺久
        await page.waitFor(10000);
        console.log('sleep 10 秒,让页面加载完成后的 GetAllCities 这个 ajax 请求完成。');

        // 先选择 states ,会触发一个ajax ,把这个state下面的city都加载出来
        // 此时页面会出现一个 loading,结束时,loading 就消失了
        // origin
        await page.waitForSelector('#oStates');

        let originStateValue = await page.evaluate(() => {
            let value = ''
            document.querySelectorAll("#oStates option").forEach(element => {
                if ((element as HTMLElement).innerText === "CA") {
                    value = (element as HTMLInputElement).value
                }
            });
            return value
        });

        console.log('origin state value:' + originStateValue);
        await page.select('#oStates', originStateValue);


        // 等 ajax 完成
        console.log('sleep 8 秒,等 ajax 获取所有的 origin cities');
        page.waitFor(8000);

        // 再输入city
        await page.waitForSelector('#ocities');
        await page.type('#ocities', 'Atwater', { delay: 1000 });

        // 此时应该出现智能提示
        let originCities = await page.$$('#SLoCities ul li');
        // 判断 originCities 的个数,如果为0或者大于1, 就放弃这个搜索任务吧
        // 如果只有一个,就 click
        if (originCities.length === 1) {
            await originCities[0].click();
            console.log('找到一个 origin city');
        } else {
            console.log('没有找到 origin city');
            return;
        }

        // origin radius
        await page.waitForSelector('#orgRadius');
        // 取值范围: 25, 50, 75, 100, 150, 200, 250, 300

        let originRadiusValue = await page.evaluate(() => {
            let value = '';
            document.querySelectorAll("#orgRadius option").forEach(element => {
                if ((element as HTMLElement).innerText === "150") {
                    value = (element as HTMLInputElement).value
                }
            });
            return value;
        });

        await page.select('#orgRadius', originRadiusValue);

        // destination
        await page.waitForSelector('#dStates');

        let destinationStateValue = await page.evaluate(() => {
            let value = ''
            document.querySelectorAll("#dStates option").forEach(element => {
                if ((element as HTMLElement).innerText === "WA") {
                    value = (element as HTMLInputElement).value
                }
            });
            return value
        });

        console.log('destination state value:' + destinationStateValue);

        await page.select('#dStates', destinationStateValue);

        // 等 ajax 完成
        page.waitFor(8000);
        console.log('sleep 8 秒,等 ajax 获取所有 destination cities');

        // 再输入city
        await page.waitForSelector('#dcities');
        await page.type('#dcities', 'Sumner', { delay: 1000 });

        page.waitFor(1000);

        // 此时应该出现智能提示
        let destinationCities = await page.$$('#SLdCities ul li');
        // 判断 orginCities 的个数,如果为0或者大于1, 就放弃这个搜索任务吧
        // 如果只有一个,就 click
        if (destinationCities.length === 1) {
            await destinationCities[0].click();
            console.log('找到一个 destination city');
        } else {
            console.log('没有找到 destination city');
            return;
        }

        // destination radius
        await page.waitForSelector('#destRadius');
        // 取值范围: 25, 50, 75, 100, 150, 200, 250, 300

        let destinationRadiusValue = await page.evaluate(() => {
            let value = '';
            document.querySelectorAll("#destRadius option").forEach(element => {
                if ((element as HTMLElement).innerText === "150") {
                    value = (element as HTMLInputElement).value
                }
            });
            return value;
        });

        await page.select('#destRadius', destinationRadiusValue);


        // equipment
        await page.waitForSelector('#TrailerTypes');
        await page.select('#TrailerTypes', '0'); // 0 是 All 1 是 Reefer 2 是 Van

        // date
        await page.waitForSelector('#datepicker');
        await page.type('#datepicker', '05/07/2020');

        // 开始搜索
        console.log('开始搜索');

        let searchButton = await page.waitForSelector('#SLSrchBtn');
        // await searchButton.click();
        await page.evaluate(() => {
            let btn: HTMLElement = document.querySelector('#SLSrchBtn') as HTMLElement;
            btn.click();
        });

        // 等待搜索结果
        console.log('等待搜索结果');
        await page.waitFor(10000);
        await page.waitForSelector('div.ag-body');

        const resultHtml = await page.$eval('div.ag-body', e => e.innerHTML);


        console.log(resultHtml);

        const $ = cheerio.load(resultHtml);
        
        $('div.ag-row').each((_index, _item) => {

            const divs = $(_item).find('div');

            const postID = $(divs[1]).text();
            console.log("post id:" + postID);

            const pickDate = $(divs[2]).text();
            console.log(pickDate);

            const pickRadius = $(divs[3]).text();
            console.log(pickRadius);

            const pickCity = $(divs[4]).text();
            console.log(pickCity);

            const pickState = $(divs[5]).text();
            console.log(pickState);

            const dropCity = $(divs[6]).text();
            console.log(dropCity);

            const dropState = $(divs[7]).text();
            console.log(dropState);

            const equipment = $(divs[8]).text();
            console.log(equipment);

            const distance = $(divs[9]).text();
            console.log(distance);

            console.log("\n");
        });

        // todo 点击左边的展开按钮就会显示extra信息, 但是我不知道怎么依次展开。。

        await browser.close();
        console.log('done');
    });
