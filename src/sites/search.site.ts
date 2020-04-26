import puppeteer from 'puppeteer';
import { SingletonTedis } from '../tools/tedis';
import { useScreenshot } from '../tools/index';
import { AddNotification, InactiveLoadSource } from '../api';
export abstract class SearchSite implements ISite {
    
    public static siteName: string;
    protected browser: puppeteer.Browser;
    protected page: puppeteer.Page;
    protected isUseScreenshot = useScreenshot() === 'yes'

    public constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    public async closePage() {
        this.page && this.page.close()
    }

    protected async screenshot() {
        if (this.isUseScreenshot) {
           await this.page.screenshot({
                path: ' /home/ubuntu/screenshot'
            })
        }
    }

    protected async addUserToLogoutList(task: ITASK) {
        await SingletonTedis.addUserToLogoutList(task.user_id, task.site)
        await AddNotification(task.user_id, `${task.site} logout`)
    }

    protected async notifyLoginFaild(task: ITASK) {
        await InactiveLoadSource(task.user_id, task.site)
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


}
