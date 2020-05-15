import puppeteer from 'puppeteer';
import { SingletonTedis } from '../tools/tedis';
import { AddNotification, InactiveLoadSource } from '../api';
import { SiteError } from '../error';
import { useScreenshot } from '../tools/index';
import { Log } from '../tools/log';
import { userAgent, viewPort } from '../settings';

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

    public async doLogin(task: ITASK) {
        if (!this.loginPage) {
            return;
        }
        await this.loginPrepare(task);
        try {
            await this.login(task);
        } catch (e) {
            await this.screenshot('login error');
            await this.addUserToLogoutList(task);
            this.log.log('login error', e);
        }
    }

    public async doSearch(task: ITASK) {
        await this.searchPrepare(task);
        try {
            await this.search(task);
        } catch (e) {
            if (e instanceof SiteError && e.type === 'logout') {
                await this.addUserToLogoutList(task);
                await this.notifyLoginFaild(task);
            }
            await this.screenshot('search error');
            this.log.log('search error', e);
        }
    }

    public async closePage() {
        // this.page && this.page.close();
    }

    protected async loginPrepare(task: ITASK) {
        this.log = new Log(this.debugPre);
        this.log.log('loginPrepare');
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.loginPage, { timeout: 20000 }).catch((e) => {
            this.generateError('timeout', 'login page load timeout');
        });
    }

    protected async searchPrepare(task: ITASK) {
        this.log = new Log(this.debugPre);
        this.log.log('searchPrepare');
        this.page = await this.browser.newPage();
        await this.page.setViewport(viewPort);
        await this.page.setUserAgent(userAgent);
        await this.page.goto(this.searchPage, { timeout: 20000 }).catch((e) => {
            this.generateError('timeout', 'search page load timeout');
        });
    }

    protected async login(task: ITASK) {}

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

    protected async addUserToLogoutList(task: ITASK) {
        await SingletonTedis.addUserToLogoutList(task.user_id, task.site);
        await AddNotification(task.user_id, `${task.site} logout`);
    }

    protected async notifyLoginFaild(task: ITASK) {
        await InactiveLoadSource(task.user_id, task.site);
    }

    protected async removeUserFromLogoutList(task: ITASK) {
        await SingletonTedis.removeUserFromLogoutList(task.user_id, task.site);
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
