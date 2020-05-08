import puppeteer from 'puppeteer';
import { SingletonTedis } from '../tools/tedis';
import { AddNotification, InactiveLoadSource } from '../api';
import { SiteError } from '../error';
import { useScreenshot } from '../tools/index';
import { Log } from '../tools/log';

export abstract class SearchSite implements ISite {
    public static siteName: string;
    public needLogin = true;
    protected debugPre = '';
    protected browser: puppeteer.Browser;
    protected page: puppeteer.Page;
    protected isUseScreenshot = useScreenshot() === 'yes';
    protected log: Log;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public async doLogin(task: ITASK) {
        this.prepare();
        try {
            await this.login(task);
        } catch (e) {
            await this.screenshot('login error');
            await this.addUserToLogoutList(task);
            this.log.log('login error', e);
        }
    }

    public async doSearch(task: ITASK) {
        this.prepare();
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

    protected prepare() {
        this.log = new Log(this.debugPre);
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
