import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SearchSite } from './searchSite';
import { ModifyPostData } from '../tools/index';
import { PostSearchData } from '../api';
import { userAgent, viewPort, waitingTimeout } from '../settings';

export class JBHunt extends SearchSite {
    public static siteName = 'JB Hunt';
    protected debugPre = 'JB Hunt';
    protected searchPage = 'https://www.jbhunt.com/loadboard/load-board/map';

    protected async search(task: ITASK) {
        await this.page.click('p-dropdown[formcontrolname="equipmentType"]');
        await this.page.waitFor(500);
        await this.page.click('[role="option"][aria-label="Dry Van"]');

        await this.page.evaluate((criteria: IQuery) => {
            const orignInput = document.querySelector(
                '.header-container [formcontrolname=origin] input'
            ) as HTMLInputElement;
            orignInput.value = criteria.origin;

            const dhoInput = document.querySelector(
                '.header-container input[formcontrolname="deadheadOrigin"]'
            ) as HTMLInputElement;
            dhoInput.value = criteria.origin_radius;

            const destInput = document.querySelector(
                '.header-container [formcontrolname=destination] input'
            ) as HTMLInputElement;
            destInput.value = criteria.destination;

            const dhdInput = document.querySelector(
                '.header-container input[formcontrolname="deadheadDestination"]'
            ) as HTMLInputElement;
            dhdInput.value = criteria.destination_radius;
        }, task.criteria);

        await this.page.click('.search-button');
    }
}
