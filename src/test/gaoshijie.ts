import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import dateformat from 'dateformat';
import { TimeoutError } from 'puppeteer/Errors';

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

        // // https://carrierdashboard.tql.com/#/LoadSearch ======================================================
        // const page = await browser.newPage();
        //
        // page.once('load', () => console.log('搜索页面加载完成。'));
        //
        // page.on('requestfinished', (request) => {
        //     console.log(
        //         'on request finished. url:' + request.url() + ' method: ' + request.method()
        //     );
        //     if (
        //         request.url() ===
        //         'https://lmservicesext.tql.com/carrierdashboard.web/api/SearchLoads/SearchAvailableLoadsByState'
        //     ) {
        //         console.log('post data:' + request.postData());
        //     }
        // });
        //
        // const url = 'https://carrierdashboard.tql.com/#/LoadSearch';
        //
        // await page.goto(url, { waitUntil: 'load' });
        //
        // // 页面加载完成后,需要等一段时间,让 ajax 完成。
        // // https://lmservicesext.tql.com/carrierdashboard.web/api/Location/GetAllCities 这个ajax耗时挺久
        // await page.waitFor(10000);
        // console.log('sleep 10 秒,让页面加载完成后的 GetAllCities 这个 ajax 请求完成。');
        //
        // // 先选择 states ,会触发一个ajax ,把这个state下面的city都加载出来
        // // 此时页面会出现一个 loading,结束时,loading 就消失了
        // // origin
        // await page.waitForSelector('#oStates');
        //
        // let originStateValue = await page.evaluate(() => {
        //     let value = '';
        //     document.querySelectorAll('#oStates option').forEach((element) => {
        //         if ((element as HTMLElement).innerText === 'CA') {
        //             value = (element as HTMLInputElement).value;
        //         }
        //     });
        //     return value;
        // });
        //
        // console.log('origin state value:' + originStateValue);
        // await page.select('#oStates', originStateValue);
        //
        // // 等 ajax 完成
        // console.log('sleep 8 秒,等 ajax 获取所有的 origin cities');
        // page.waitFor(8000);
        //
        // // 再输入city
        // await page.waitForSelector('#ocities');
        // await page.type('#ocities', 'Atwater', { delay: 1000 });
        //
        // // 此时应该出现智能提示
        // let originCities = await page.$$('#SLoCities ul li');
        // // 判断 originCities 的个数,如果为0或者大于1, 就放弃这个搜索任务吧
        // // 如果只有一个,就 click
        // if (originCities.length === 1) {
        //     await originCities[0].click();
        //     console.log('找到一个 origin city');
        // } else {
        //     console.log('没有找到 origin city');
        //     return;
        // }
        //
        // // origin radius
        // await page.waitForSelector('#orgRadius');
        // // 取值范围: 25, 50, 75, 100, 150, 200, 250, 300
        //
        // let originRadiusValue = await page.evaluate(() => {
        //     let value = '';
        //     document.querySelectorAll('#orgRadius option').forEach((element) => {
        //         if ((element as HTMLElement).innerText === '150') {
        //             value = (element as HTMLInputElement).value;
        //         }
        //     });
        //     return value;
        // });
        //
        // await page.select('#orgRadius', originRadiusValue);
        //
        // // destination
        // await page.waitForSelector('#dStates');
        //
        // let destinationStateValue = await page.evaluate(() => {
        //     let value = '';
        //     document.querySelectorAll('#dStates option').forEach((element) => {
        //         if ((element as HTMLElement).innerText === 'WA') {
        //             value = (element as HTMLInputElement).value;
        //         }
        //     });
        //     return value;
        // });
        //
        // console.log('destination state value:' + destinationStateValue);
        //
        // await page.select('#dStates', destinationStateValue);
        //
        // // 等 ajax 完成
        // page.waitFor(8000);
        // console.log('sleep 8 秒,等 ajax 获取所有 destination cities');
        //
        // // 再输入city
        // await page.waitForSelector('#dcities');
        // await page.type('#dcities', 'Sumner', { delay: 1000 });
        //
        // page.waitFor(1000);
        //
        // // 此时应该出现智能提示
        // let destinationCities = await page.$$('#SLdCities ul li');
        // // 判断 orginCities 的个数,如果为0或者大于1, 就放弃这个搜索任务吧
        // // 如果只有一个,就 click
        // if (destinationCities.length === 1) {
        //     await destinationCities[0].click();
        //     console.log('找到一个 destination city');
        // } else {
        //     console.log('没有找到 destination city');
        //     return;
        // }
        //
        // // destination radius
        // await page.waitForSelector('#destRadius');
        // // 取值范围: 25, 50, 75, 100, 150, 200, 250, 300
        //
        // let destinationRadiusValue = await page.evaluate(() => {
        //     let value = '';
        //     document.querySelectorAll('#destRadius option').forEach((element) => {
        //         if ((element as HTMLElement).innerText === '150') {
        //             value = (element as HTMLInputElement).value;
        //         }
        //     });
        //     return value;
        // });
        //
        // await page.select('#destRadius', destinationRadiusValue);
        //
        // // equipment
        // await page.waitForSelector('#TrailerTypes');
        // await page.select('#TrailerTypes', '0'); // 0 是 All 1 是 Reefer 2 是 Van
        //
        // // date
        // await page.waitForSelector('#datepicker');
        // await page.type('#datepicker', '05/07/2020');
        //
        // // 开始搜索
        // console.log('开始搜索');
        //
        // let searchButton = await page.waitForSelector('#SLSrchBtn');
        // // await searchButton.click();
        // await page.evaluate(() => {
        //     let btn: HTMLElement = document.querySelector('#SLSrchBtn') as HTMLElement;
        //     btn.click();
        // });
        //
        // // 等待搜索结果
        // console.log('等待搜索结果');
        // await page.waitFor(10000);
        // await page.waitForSelector('div.ag-body');
        //
        // const resultHtml = await page.$eval('div.ag-body', (e) => e.innerHTML);
        //
        // console.log(resultHtml);
        //
        // const $ = cheerio.load(resultHtml);
        //
        // $('div.ag-row').each((_index, _item) => {
        //     const divs = $(_item).find('div');
        //
        //     const postID = $(divs[1]).text();
        //     console.log('post id:' + postID);
        //
        //     const pickDate = $(divs[2]).text();
        //     console.log(pickDate);
        //
        //     const pickRadius = $(divs[3]).text();
        //     console.log(pickRadius);
        //
        //     const pickCity = $(divs[4]).text();
        //     console.log(pickCity);
        //
        //     const pickState = $(divs[5]).text();
        //     console.log(pickState);
        //
        //     const dropCity = $(divs[6]).text();
        //     console.log(dropCity);
        //
        //     const dropState = $(divs[7]).text();
        //     console.log(dropState);
        //
        //     const equipment = $(divs[8]).text();
        //     console.log(equipment);
        //
        //     const distance = $(divs[9]).text();
        //     console.log(distance);
        //
        //     console.log('\n');
        // });
        //
        // // todo 点击左边的展开按钮就会显示extra信息, 但是我不知道怎么依次展开。。
        //
        // await browser.close();
        // console.log('done');

        /*


        // http://www.landstaronline.com/public/login.aspx ======================================================
        const page = await browser.newPage();

        page.once('load', () => console.log('页面加载完成。'));

        // debug 用的,可以看到点击按钮有没有成功发出请求
        page.on('requestfinished', (request) => {

            if (request.url().indexOf('www.landstaronline.com') == -1) {
                return;
            }

            console.log(
                'on request finished. url:' + request.url() + ' method: ' + request.method()
            );
            if (request.method() == "POST") {
                console.log(" post data: " + request.postData());
            }
        });

        const url = 'http://www.landstaronline.com/public/login.aspx';

        await page.goto(url, { waitUntil: 'load' });

        // 用户名
        await page.waitForSelector('#USER');
        await page.type('#USER', 'ajgtranspo');

        // 密码
        await page.waitForSelector('#PASSWORD');
        await page.type('#PASSWORD', 'Loaded2020');

        // 点击登录
        // 点击登录后,触发跳转,会跳转几次,最终会跳转到 http://spportal.landstaronline.com/
        await page.waitForSelector('#Submit');
        await page.click('#Submit');

        // console.log('sleep 5 seconds');
        // await page.waitFor(5000);

        // 最多等 5 秒,如果登录成功会跳转到首页
        let login = false;
        try {
            await page.waitForSelector('#dashboard', {timeout: 5000});
            console.log("登录成功。");

            const url_ = page.url();
            console.log("登录成功后的url是: " + url_);

            login = true;
        } catch (e) {
            if (e instanceof TimeoutError) {
                console.log("登录失败。");
                // todo 打日志、截图、调用接口上报
            }
        }

        if (login) {
            const searchUrl = 'http://www.landstaronline.com/loads';

            await page.goto(searchUrl, { waitUntil: 'load' });

            // origin radius
            await page.waitForSelector('#OriginRadius');
            await page.select('#OriginRadius', '150'); // 可选值:0, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500

            // destination radius
            await page.waitForSelector('#DestinationRadius');
            await page.select('#DestinationRadius', '150');

            // 限制只搜索美国,不搜索加拿大
            await page.waitForSelector('#OriginRestrictResults');
            await page.select('#OriginRestrictResults', 'US');

            await page.waitForSelector('#DestinationRestrictResults');
            await page.select('#DestinationRestrictResults', 'US');

            // pickup start date
            await page.waitForSelector('#PickupDateStart');
            await page.type('#PickupDateStart', '05/13/2020');

            // pickup end date 不用输入, 输入 start date 时,会自动填充 end date
            //await page.waitForSelector('#PickupDateEnd');
            //await page.type('#PickupDateEnd', '05/13/2020');

            // origin
            await page.waitForSelector('#TxtOriginControl');
            await page.type('#TxtOriginControl', 'Atwater, CA');

            await page.waitFor(1000); // 等 ajax 请求成功

            // 此时会出现智能提示
            await page.waitForSelector('#ui-id-1 li', {timeout: 3000});

            let temp = await page.$$('#ui-id-1 li');
            // 如果只有一个,就 click
            if (temp.length === 1) {
                await temp[0].click();
                console.log('找到一个 origin');
            } else {
                console.log('没有找到 origin');
                return;
            }

            // destination
            await page.waitForSelector('#TxtDestinationControl');
            await page.type('#TxtDestinationControl', 'Sumner, WA');

            await page.waitFor(1000); // 等 ajax 请求成功

            // 此时会出现智能提示
            await page.waitForSelector('#ui-id-2 li', {timeout: 3000});

            let temp2 = await page.$$('#ui-id-2 li');
            // 如果只有一个,就 click
            if (temp2.length === 1) {
                await temp2[0].click();
                console.log('找到一个 destination');
            } else {
                console.log('没有找到 destination');
                return;
            }

            // 选择 equipment
            const search_equipment = "VAN"; // 可选的值是 VAN 和 REFR ,注意不是 REEFER
            await page.evaluate((search_equipment) => {

                const i =( document.querySelector('#ddArrowTrailerTypes') as HTMLElement);
                i.click();

                document.querySelectorAll('#treeDivmultiSelectTrailerTypes > ul>li').forEach((element) => {
                    const name = (element.querySelector('div span.k-in') as HTMLElement).innerText;
                    console.log(name);
                    if (name == search_equipment) {
                        const checkbox = element.querySelector('div span.k-checkbox input') as HTMLElement;
                        checkbox.click();
                    }
                });

                i.click();

            }, search_equipment);


            // 点击 search ,会跳转到 http://www.landstaronline.com/Loads/Load/SearchResults
            // 查看  http://www.landstaronline.com/Loads/Load/PerformSearch 这个请求的 post data 是不是期望的

            await page.waitForSelector('#searchButton');
            console.log("找到搜索按钮");

            // await page.click('#searchButton'); // 不 work
            await page.evaluate(() => {
                let btn: HTMLElement = document.querySelector('#searchButton') as HTMLElement;
                btn.click();
            });

            // 等待跳转
            console.log('等待跳转');
            // await page.waitFor(1000);

            let success = false;
            try {
                // #ResultsTabs 这个div 就是存放搜索结果的地方
                await page.waitForSelector('#ResultsTabs', {timeout: 5000});
                console.log('搜索成功。');

                success = true;
            } catch (e) {
                if (e instanceof TimeoutError) {
                    console.log("搜索失败。");
                }
            }

            if (success) {

                const resultHtml = await page.$eval('div#Loads', (e) => e.innerHTML);

                console.log(resultHtml);

                const $ = cheerio.load(resultHtml);

                if ($('tbody tr').length == 1) {
                    console.log("没有符合条件的数据。");
                } else {

                    $('tbody tr.t-master-row').each((_index, _item) => {

                        const tds = $(_item).find('td');
                        

                        let t = $(tds[2]).text().trim().split("\n");
                        let t1 = t[0].trim();
                        let t2 = t[1].trim();
                        console.log("agency: " + t1);
                        console.log("contact: " + t2);

                        t = $(tds[3]).text().trim().split("\n");
                        t1 = t[0].trim();
                        t2 = t[1].trim();
                        console.log("pickup date: " + t1);
                        console.log("delivery date: " + t2);

                        t = $(tds[4]).text().trim().split("\n");
                        t1 = t[0].trim();
                        t2 = t[2].trim();
                        console.log("origin: " + t1);
                        console.log("destination: " + t2);


                        t = $(tds[5]).text().trim().split("\n");
                        t1 = t[0].trim();
                        t2 = t[1].trim();
                        console.log("distance from origin: " + t1);
                        console.log("distance from delivery: " + t2);

                        let tt = $(tds[6]).text().trim();
                        console.log("equipment: " + tt);


                        tt = $(tds[8]).text().trim();
                        console.log("distance: " + tt);

                        t = $(tds[9]).text().trim().split("\n");
                        t1 = t[0].trim();
                        t2 = t[1].trim();
                        console.log("weight: " + t1);
                        console.log("weight type: " + t2);


                        tt = $(tds[10]).text().trim();
                        console.log("cmdty code: " + tt);

                    });

                }

            }

            await page.screenshot({path: '/home/ubuntu/screenshot/gaoshijie.png'});

            console.log("当前url: " + page.url());
        }

        await browser.close();
        console.log('done');

*/

        // https://www.allenlund.com/carriers/search-loads.php ======================================================
        const page = await browser.newPage();

        page.once('load', () => console.log('页面加载完成。'));

        // debug 用的,可以看到点击按钮有没有成功发出请求
        page.on('requestfinished', (request) => {
            console.log(
                'on request finished. url:' + request.url() + ' method: ' + request.method()
            );
            if (request.method() === 'POST') {
                console.log(' post data: ' + request.postData());
            }
        });

        const loginUrl = 'https://www.allenlund.com/';

        await page.goto(loginUrl, { waitUntil: 'load' });

        // 用户名
        await page.waitForSelector('#login_user');
        await page.type('#login_user', '187173');

        // 密码
        await page.waitForSelector('input[name="login_pass"]');
        await page.type('input[name="login_pass"]', 'Loaded2020!');

        // 点击登录
        // 点击登录后,触发跳转,会跳转几次,最终会跳转到 http://spportal.landstaronline.com/
        await page.waitForSelector('input[type="submit"]');
        await page.click('input[type="submit"]');

        // 登录成功后,会跳转到 https://www.allenlund.com/carriers/carrier-profile.php 页面
        let login = false;
        try {
            await page.waitForSelector('table.company-info', { timeout: 5000 });
            console.log('登录成功。');

            const url_ = page.url();
            console.log('登录成功后的url是: ' + url_);

            login = true;
        } catch (e) {
            if (e instanceof TimeoutError) {
                console.log('登录失败。');
                // todo 打日志、截图、调用接口上报
            }
        }

        if (login) {
            const searchUrl = 'https://www.allenlund.com/carriers/search-loads.php';

            await page.goto(searchUrl, { waitUntil: 'load' });

            // equipment
            await page.waitForSelector('select[name="equipment_type"]');
            await page.select('select[name="equipment_type"]', 'V'); // V 表示 Van, R 表示 Reefer

            // origin city
            await page.waitForSelector('input[name="city1"]');
            await page.type('input[name="city1"]', 'TULARE'); // 大小写不敏感

            // origin state
            await page.waitForSelector('input[name="state1"]');
            await page.type('input[name="state1"]', 'CA');

            // origin radius
            // 输入了这个就查询不出来结果了,可能是网站问题
            // await page.waitForSelector('input[name="radius1"]');
            // await page.type('input[name="radius1"]', '100');

            // destination city
            await page.waitForSelector('input[name="city2"]');
            await page.type('input[name="city2"]', 'MORRIS'); // 大小写不敏感

            // destination state
            await page.waitForSelector('input[name="state2"]');
            await page.type('input[name="state2"]', 'IL');

            // destination radius
            // 输入了这个就查询不出来结果了,可能是网站问题
            // await page.waitForSelector('input[name="radius2"]');
            // await page.type('input[name="radius2"]', '100');

            await page.waitForSelector('input[name="search"]');
            console.log('点击搜索');

            // 点击后会post提交,然后加载页面
            await page.click('input[name="search"]');
            // await page.evaluate(() => {
            //     let btn: HTMLElement = document.querySelector('#searchButton') as HTMLElement;
            //     btn.click();
            // });

            console.log('查看搜索结果');

            let success = false;
            try {
                // 这个就是存放搜索结果的地方
                await page.waitForSelector('div.tbl-margin table', { timeout: 5000 });
                console.log('搜索成功。');

                success = true;
            } catch (e) {
                if (e instanceof TimeoutError) {
                    console.log('搜索失败。');
                }
            }

            if (success) {
                // 判断有没有数据
                const hasData = await page.$eval(
                    'div.tbl-margin table > tbody > tr:nth-child(2)',
                    (e) => e.querySelectorAll('td').length > 1
                );

                console.log(hasData);

                if (hasData) {
                    const resultHtml = await page.$eval(
                        'div.tbl-margin table > tbody',
                        (e) => e.outerHTML
                    );

                    console.log(resultHtml);

                    const $ = cheerio.load(resultHtml);

                    console.log($('tr').length);

                    $('tr').each((_index, _item) => {
                        console.log(_index, _item);
                        if (_index === 0) {
                            return;
                        }

                        const tds = $(_item).find('td');

                        let postingID = $(tds[1]).text().trim();
                        console.log('postingID: ' + postingID);

                        let pickupDate = $(tds[2]).text().trim();
                        console.log('pickupDate: ' + pickupDate);

                        let equipment = $(tds[3]).text().trim();
                        console.log('equipment: ' + equipment);

                        let originCity = $(tds[4]).text().trim();
                        console.log('originCity: ' + originCity);

                        let originState = $(tds[5]).text().trim();
                        console.log('originState: ' + originState);

                        let destinationCity = $(tds[6]).text().trim();
                        console.log('destinationCity: ' + destinationCity);

                        let destinationState = $(tds[7]).text().trim();
                        console.log('destinationState: ' + destinationState);

                        let contact = $(tds[8]).text().trim();
                        console.log('contact: ' + contact);
                    });
                } else {
                    console.log('Nothing found.');
                }
            }

            await page.screenshot({ path: '/home/ubuntu/screenshot/gaoshijie.png' });

            console.log('当前url: ' + page.url());
        }

        await browser.close();
        console.log('done');
    });
