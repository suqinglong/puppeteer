import { Config } from './tools/index';

export const settings = {
    chromeSettings: {
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        devtools: false,
        headless: false
    },
    host: 'http://54.151.97.217:9501',
    token: '6bbcbce7bc90c008',
    pageWaitTime: Config.isDevelop ? 0 : 30000,
    userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36',
    viewPort: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
    }
};
