import { Tedis } from 'tedis';

export class SingletonTedis {
    private static instance: Tedis;

    // add user to logout list
    public static async addUserToLogoutList(userId: string, siteName: string) {
        const r = this.getInstance()
        await r.set(`${userId}-${this.modifySiteName(siteName)}`, '1')
    }

    public static getInstance(): Tedis {
        if (!SingletonTedis.instance) {
            SingletonTedis.instance = new Tedis({
                host: '127.0.0.1',
                port: 6379
            });
        }
        return SingletonTedis.instance;
    }

    // check if user logout at a site
    public static async isUserLogoutSite(userId: string, siteName: string): Promise<boolean> {
        const r = this.getInstance()
        return (await r.get(`${userId}-${this.modifySiteName(siteName)}`)) === '1'
    }

    // remove user to lougout list
    public static async removeUserFromLogoutList(userId: string, siteName: string) {
        const r = this.getInstance()
        await r.del(`${userId}-${this.modifySiteName(siteName)}`)
    }

    private static modifySiteName(siteName: string): string {
        return siteName.replace(/\s/g, '').toLowerCase()
    }
}
