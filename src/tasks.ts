import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { getMode } from './tools/index';
import { TestData } from './test.config';

export class Tasks implements ITasksClass {
    private mode: IMode = getMode();
    private search = new Search();

    public async getTask() {
        await this.developPrepare();
        while (true) {
            const taskResult = await SingletonTedis.getTask();
            if (!taskResult) continue;
            const task: ITASK = JSON.parse(taskResult) as ITASK;
            if (Number(new Date()) - Number(task.time) * 1000 > 30 * 1000) {
                continue;
            }
            console.log('get task', task);
            let browserWSEndpoint = await SingletonTedis.getBrowserKey(task.user_id);
            // if no browser then create
            if (!browserWSEndpoint) {
                console.log('create browserWSEndpoint');
                if (await SingletonTedis.getCreateBrowserLock(task.user_id)) {
                    browserWSEndpoint = await this.search.createBrowser(task);
                    SingletonTedis.setBrowserKey(task.user_id, browserWSEndpoint);
                    await SingletonTedis.deleteBrowserLock(task.user_id);
                } else {
                    while (true) {
                        browserWSEndpoint = await SingletonTedis.getBrowserKey(task.user_id);
                        if (browserWSEndpoint) {
                            break;
                        }
                        await this.sleep(1000);
                    }
                }
            }
            await this.search.doTask(task, String(browserWSEndpoint));
        }
    }

    private async sleep(num: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, num);
        });
    }

    private async developPrepare() {
        await SingletonTedis.deleteKeys();
        if (this.mode === 'develop') {
            const taskResult = JSON.stringify(TestData);
            await SingletonTedis.pushTask(taskResult);
        }
    }
}
