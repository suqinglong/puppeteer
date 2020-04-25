import puppeteer from 'puppeteer';
import {SingletonTedis} from '../tools/tedis';
export abstract class SearchSite implements ISite {
    protected browser: puppeteer.Browser;

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    protected async addUserToLogoutList(task: ITASK) {
        await SingletonTedis.addUserToLogoutList(task.user_id, task.site)
    }

    protected async removeUserFromLogoutList(task: ITASK) {
        await SingletonTedis.removeUserFromLogoutList(task.user_id, task.site)
    }

    protected async sleep(num: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, num);
        });
    }

    public abstract async login(task: ITASK);

    public abstract async search(task: ITASK);

    public abstract async closePage();
}
