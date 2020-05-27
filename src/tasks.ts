import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { Config } from './tools/index';
import { prePareTestData } from './test.config';

export class Tasks implements ITasksClass {
    private search = new Search();

    public async getTask() {
        await this.prepare();
        while (true) {
            try {
                await this.sleep(1000);
                console.log('\n\n\n');
                const taskResult = await SingletonTedis.getTask();
                if (!taskResult) continue;
                const task: ITASK = JSON.parse(taskResult) as ITASK;
                if (Number(new Date()) - Number(task.time) * 1000 > 200 * 1000) {
                    console.log('------- task passed for over 200s:', task.task_id)
                    continue;
                }
                console.log('---- get task ----', task);
                await this.search.doTask(task, await this.getBrowserWSEndpoint(task));
            } catch (e) {
                console.log('getTask error', e);
            }
        }
    }

    private async getBrowserWSEndpoint(task: ITASK): Promise<string> {
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
                    await this.sleep(100);
                    if (browserWSEndpoint) {
                        break;
                    }
                }
            }
        }
        return String(browserWSEndpoint);
    }

    private async sleep(num: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, num);
        });
    }

    private async prepare() {
        await SingletonTedis.deleteKeys();
        if (Config.isDevelop) {
            // do something
            await prePareTestData();
        }
    }
}
