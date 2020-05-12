import { DAT } from './power.dat.com';
import { Echo } from './echodrive.echo.com';
import { JBHunt } from './www.jbhunt.com';
import { CHRobinson } from './www.navispherecarrier.com';
import { Coyote } from './connect.coyote.com';
import { Sunteck } from './carriers.suntecktts.com';
import { Werner } from './www.werner.com';
import { TQL } from './carrierdashboard.tql.com';
import { SearchSite } from './searchSite';
import { UberFreight } from './uber.freight';
import puppeteer from 'puppeteer';

const sites = [Echo, DAT, JBHunt, CHRobinson, Coyote, Sunteck, Werner, TQL, UberFreight];

export class SiteManager {
    public static getSite(siteName: string): new (browser: puppeteer.Browser) => SearchSite {
        return sites.find((item) => item.siteName === siteName);
    }
}
