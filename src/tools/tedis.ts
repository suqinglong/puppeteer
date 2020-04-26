import { Tedis } from 'tedis';

export class SingletonTedis {
    private static instance: Tedis;

    // add user to logout list
    public static async addUserToLogoutList(userId: string, siteName: string) {
        const r = this.getInstance()
        await r.set(this.getUserInfoKey(userId, siteName), '1')
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
        return (await r.get(this.getUserInfoKey(userId, siteName))) === '1'
    }

    // remove user to lougout list
    public static async removeUserFromLogoutList(userId: string, siteName: string) {
        const r = this.getInstance()
        await r.del(this.getUserInfoKey(userId, siteName))
    }

    public static async deleteKeys() {
        const r = this.getInstance()
        const keys = [
            ...(await r.keys('*:browser_ws_endpoint')),
            ...(await r.keys('*:browser_ws_create')),
            ...(await r.keys('*:user_info_key'))
        ];
        keys.forEach((key) => {
            r.del(key);
        });

        console.log('deleteKeys', keys)
    }

    public static setBrowserKey(userId: string, broserKey: string) {
        const r = this.getInstance()
        r.set(`user_id:${userId}:browser_ws_endpoint`, broserKey);
    }

    public static async getBrowserKey(userId: string): Promise<string | number> {
        const r = this.getInstance()
        const key = await r.get(`user_id:${userId}:browser_ws_endpoint`);
        return key;
    }

    public static async getCreateBrowserLock(userId: string): Promise<boolean> {
        const r = this.getInstance()
        return (await r.setnx(`user_id:${userId}:browser_ws_create`, '1')) === 1;
    }

    public static async deleteBrowserLock(userId: string) {
        const r = this.getInstance()
        await r.del(`user_id:${userId}:browser_ws_create`);
    }

    public static async getTask() {
        const r = this.getInstance()
        return (await r.blpop(0, 'search_tasks'))[1];
    }

    public static async pushTask(taskResult:string) {
        const r = this.getInstance()
        await r.lpush('search_tasks', taskResult);
    }

    private static getUserInfoKey(userId: string, siteName: string): string {
        return `${userId}-${siteName.replace(/\s/g, '').toLowerCase()}:user_info_key`
    }
}
