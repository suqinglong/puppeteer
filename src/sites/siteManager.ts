import { DAT } from './power.dat.com';
import { DAT2 } from './dat';
import { Echo } from './echodrive.echo.com';
import { JBHunt } from './www.jbhunt.com';
import { CHRobinson } from './www.navispherecarrier.com';
import { Coyote } from './connect.coyote.com';
import { Sunteck } from './carriers.suntecktts.com';
import { Werner } from './www.werner.com';
import { TQL } from './carrierdashboard.tql.com';
import { SearchSite } from './searchSite';
import { UberFreight } from './uber.freight';
import { Landstar } from './www.landstaronline.com';
import { Allenlund } from './www.allenlund.com';
import puppeteer from 'puppeteer';

const sites = [
    Echo,
    DAT2,
    JBHunt,
    CHRobinson,
    Coyote,
    Sunteck,
    Werner,
    TQL,
    UberFreight,
    Landstar,
    Allenlund
];

export class SiteManager {
    public static getSite(siteName: string): new (browser: puppeteer.Browser) => SearchSite {
        return sites.find((item) => item.siteName === siteName);
    }
}
