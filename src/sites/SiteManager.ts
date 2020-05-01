import { PowerDatComSite } from './power.dat.com';
import { EchodriveEchoCom } from './echodrive.echo.com';
import { WWWJbhuntCom } from './www.jbhunt.com';
import { NavispherecarrierCom } from './www.navispherecarrier.com';
import { ConnectCoyoteCom } from './connect.coyote.com';
import { CarriersSunteckttsCom } from './carriers.suntecktts.com';
import { WwwWernerCom } from './www.werner.com'
import { SearchSite } from './search.site';
import puppeteer from 'puppeteer';

const sites = [
    EchodriveEchoCom,
    PowerDatComSite,
    WWWJbhuntCom,
    NavispherecarrierCom,
    ConnectCoyoteCom,
    CarriersSunteckttsCom,
    WwwWernerCom
];

export class SiteManager {
    public static getSite(siteName: string): new (browser: puppeteer.Browser) => SearchSite {
        return sites.find((item) => item.siteName === siteName);
    }
}
