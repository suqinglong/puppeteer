import puppeteer from 'puppeteer';
import { SingletonTedis } from '../tools/tedis';
import { AddNotification, InactiveLoadSource } from '../api';
import { SiteError } from '../error';
import { useScreenshot } from '../tools/index';
import { Log } from '../tools/log';
import { userAgent, viewPort, pageWaitTime } from '../settings';

export abstract class SearchSite implements ISite {
    public static siteName: string;
    protected debugPre = '';
    protected browser: puppeteer.Browser;
    protected page: puppeteer.Page;
    protected isUseScreenshot = useScreenshot() === 'yes';
    protected log: Log;
    protected loginPage: string;
    protected searchPage: string;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public async doSearch(task: ITASK) {
        try {
            await this.beforeSearch(task);
            await this.search(task);
            await this.afterSearch();
            await this.page.close();
        } catch (e) {
            await this.screenshot('search error');
            this.log.log('search error', e);
        }
    }

    protected async beforeSearch(task: ITASK) {
        this.log = new Log(this.debugPre);
        this.log.log('beforeSearch');
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);

        await this.page.goto(this.searchPage, { timeout: pageWaitTime }).catch(() => {
            throw this.generateError('timeout', 'search page load timeout');
        });

        // need login and has not login
        if (await this.shouldLogin(task)) {
            this.log.log('need login')
            await this.doLogin(task)
        } else {
            this.log.log('need not login')
        }

        // go to login page
        await this.page.goto(this.searchPage, { timeout: pageWaitTime }).catch(() => {
            throw this.generateError('timeout', 'search page load timeout');
        });
    }

    // run after search and before page closed
    protected async afterSearch() {

    }

    protected async doLogin(task: ITASK) {
        try {
            await this.beforeLogin(task);
            this.log.log('login begin')
            await this.login(task);
            this.log.log('login success')
            await this.page.close();
        } catch (e) {
            await this.screenshot('login error');
            await this.markUserUnableToLogin(task);
            this.log.log('login error', e);

            if (e.type !== 'timeout') {
                throw this.generateError('unableToLogin', 'login faild')
            }
        }
    }

    protected async beforeLogin(task: ITASK) {
        this.log.log('beforeLogin');
        if (this.page.url().indexOf(this.loginPage) === -1 && this.page.url().indexOf('/login') === -1) {
            this.log.log('not redirect to login page, goto login page', this.page.url(), this.loginPage)
            await this.page.goto(this.loginPage, { timeout: pageWaitTime }).catch(() => {
                throw this.generateError('timeout', 'login page load timeout');
            });
        }
    }


    protected async shouldLogin(task: ITASK): Promise<boolean> {
        const isUserUnableToLogin = await SingletonTedis.isUserUnableToLogin(task.user_id, task.site)
        return !isUserUnableToLogin && this.loginPage && this.page.url().indexOf(this.searchPage) === -1
    }

    protected async login(task: ITASK) { }

    protected generateError(type: IErrorType, msg: string) {
        return new SiteError(type, `${this.debugPre}: ${msg}`);
    }

    protected async screenshot(name: string) {
        if (this.isUseScreenshot) {
            console.log(`screenshot: ${this.debugPre}-${name}.png`);
            await this.page.screenshot({
                path: `/home/ubuntu/screenshot/${this.debugPre}-${name}.png`,
                fullPage: true
            });
        }
    }

    protected async pageScreenshot(page: puppeteer.Page, name: string) {
        if (this.isUseScreenshot) {
            await page.screenshot({
                path: `/home/ubuntu/screenshot/${name}.png`,
                fullPage: true
            });
        }
    }

    // user can't login, may be the account and password doesn't match
    protected async markUserUnableToLogin(task: ITASK) {
        await SingletonTedis.markUserUnableToLogin(task.user_id, task.site);
        // notify server this site has login problem
        await AddNotification(task.user_id, `${task.site} logout`);
        // change load srouce status to inactive
        await InactiveLoadSource(task.user_id, task.site);
    }

    protected async sleep(num: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, num);
        });
    }

    protected abstract async search(task: ITASK);
}
