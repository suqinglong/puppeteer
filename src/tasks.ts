import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { Tedis } from 'tedis';
import { getMode } from './tools/index';

export class Tasks implements ITasksClass {
    private tedis: Tedis = new SingletonTedis().getInstance();
    private mode: IMode = getMode();
    private search = new Search();

    public async getTask() {
        this.developPrepare();
        while (true) {
            const taskResult = (await this.tedis.blpop(0, 'search_tasks'))[1];
            if (!taskResult) continue;
            const task: ITASK = JSON.parse(taskResult) as ITASK;
            console.log('task', task);
            let browserWSEndpoint = await this.getBrowserKey(task.user_id);

            // if no browser then create
            if (!browserWSEndpoint) {
                if (this.getCreateBrowserLock(task.user_id)) {
                    browserWSEndpoint = await this.search.createBrowser(task);
                    this.setBrowserKey(task.user_id, browserWSEndpoint);
                    this.deleteBrowserLock(task.user_id);
                } else {
                    while (true) {
                        browserWSEndpoint = await this.getBrowserKey(task.user_id);
                        if (browserWSEndpoint) {
                            break;
                        }
                        this.sleep(1);
                    }
                }
            }
            await this.search.doTask(task, browserWSEndpoint);
        }
    }

    private async sleep(num: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, num);
        });
    }

    private setBrowserKey(userId: string, broserKey: string) {
        this.tedis.set(`user_id:${userId}:browser_ws_endpoint`, broserKey);
    }

    private async getBrowserKey(userId: string): Promise<string> {
        return String(await this.tedis.get(`user_id:${userId}:browser_ws_endpoint`));
    }

    private async getCreateBrowserLock(userId: string): Promise<boolean> {
        return (await this.tedis.setnx(`user_id:${userId}:browser_ws_create`, '1')) === 1;
    }

    private async deleteBrowserLock(userId: string) {
        await this.tedis.del(`user_id:${userId}:browser_ws_create`);
    }

    private developPrepare() {
        if (this.mode === 'develop') {
            const taskResult = JSON.stringify({
                email: 'primelinkexpress@live.com',
                password: 'Gary1978',
                user_id: '3',
                task_id: 'ca7eb2b1c5c98467ae4809d95bdc5446',
                site: 'XPO Connect',
                criteria: {
                    origin: 'Simsboro, LA',
                    origin_radius: '100',
                    destination: 'Luray, VA',
                    destination_radius: '100',
                    pick_up_date: '2020-04-22',
                    equipment: 'Van'
                }
            });
            this.tedis.lpush('search_tasks', taskResult);
        }
    }
}
