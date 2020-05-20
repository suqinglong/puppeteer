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
        this.log = new Log(this.debugPre);
        this.log.log('search begin')
        const isUserUnableToLogin = await SingletonTedis.isUserUnableToLogin(task.user_id, task.site)
        if (isUserUnableToLogin) {
            return this.log.log('user unable to login')
        }
        try {
            await this.beforeSearch(task);
            await this.search(task);
            await this.afterSearch();
            await this.page.close();
            this.log.log('search end')
        } catch (e) {
            await this.screenshot('search error');
            this.log.log('search error', e);
        }
    }

    protected async beforeSearch(task: ITASK) {
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);

        await this.page.goto(this.searchPage, { timeout: pageWaitTime }).catch(() => {
            throw this.generateError('searchTimeout', 'search page load timeout 1');
        });

        // need login and has not login
        if (await this.shouldLogin(task)) {
            this.log.log('need login')
            await this.doLogin(task)
            // go to search page
            await this.page.goto(this.searchPage, { timeout: pageWaitTime }).catch(() => {
                throw this.generateError('searchTimeout', 'search page load timeout 2');
            });
        } else {
            this.log.log('need not login')
        }
    }

    // run after search and before page closed
    protected async afterSearch() {

    }

    protected async doLogin(task: ITASK) {
        this.log.log('login begin')
        try {
            await this.beforeLogin(task);
            // if not in login page, then go to login page.
            if (!this.isSamePath(this.page.url(), this.loginPage) || !/login/i.test(this.page.url())) {
                this.log.log('not redirect to login page, goto login page', this.page.url(), this.loginPage)
                await this.page.goto(this.loginPage, { timeout: pageWaitTime }).catch(() => {
                    throw this.generateError('loginTimeout', 'login page load timeout');
                });
            }
            await this.login(task);
            this.log.log('login success')
        } catch (e) {
            await this.screenshot('login error');
            this.log.log('login error', e);
            if (e.type !== 'loginTimeout') {
                await this.markUserUnableToLogin(task);
                throw this.generateError('unableToLogin', 'login faild')
            } else {
                throw this.generateError('loginTimeout', 'login timeout')
            }
        }
    }

    protected async beforeLogin(task: ITASK) { }
    protected async login(task: ITASK) { }

    protected async shouldLogin(task: ITASK): Promise<boolean> {
        return this.loginPage && !this.isSamePath(this.page.url(), this.searchPage)
    }

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
        await AddNotification(task.user_id, `${task.site} unable to login`);
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

    private isSamePath(url1:string, url2:string) {
        const path1 = url1.split('?')[0]
        const path2 = url2.split('?')[0]
        console.log('path', path1, path2)
        return path1 && (path1 === path2)
    }

    protected abstract async search(task: ITASK);
}
