import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { Tedis } from 'tedis';
import { getMode } from './tools/index';
import { TaskData } from './demoTaskData'

export class Tasks implements ITasksClass {
    private tedis: Tedis = SingletonTedis.getInstance();
    private mode: IMode = getMode();
    private search = new Search();

    public async getTask() {
        await this.developPrepare();
        while (true) {
            const taskResult = await SingletonTedis.getTask()
            if (!taskResult) continue;
            const task: ITASK = JSON.parse(taskResult) as ITASK;
            console.log('task', task);
            let browserWSEndpoint = await SingletonTedis.getBrowserKey(task.user_id);
            console.log('have browserWSEndpoint', browserWSEndpoint);
            // if no browser then create
            if (!browserWSEndpoint) {
                console.log('no browserWSEndpoint');
                if (await SingletonTedis.getCreateBrowserLock(task.user_id)) {
                    browserWSEndpoint = await this.search.createBrowser(task);
                    console.log('createBrowser end');
                    SingletonTedis.setBrowserKey(task.user_id, browserWSEndpoint);
                    await SingletonTedis.deleteBrowserLock(task.user_id);
                } else {
                    console.log('not getCreateBrowserLock');
                    while (true) {
                        browserWSEndpoint = await SingletonTedis.getBrowserKey(task.user_id);
                        if (browserWSEndpoint) {
                            break;
                        }
                        await this.sleep(1);
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
        await SingletonTedis.deleteKeys()
        if (this.mode === 'develop') {
            const taskResult = JSON.stringify(
                TaskData["Navisphere"]
            );
            await SingletonTedis.pushTask(taskResult)
        }
    }
}
