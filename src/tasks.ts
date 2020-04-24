import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { Tedis } from 'tedis';
import { getMode } from './tools/index';

export class Tasks implements ITasksClass {
  private tedis: Tedis = new SingletonTedis().getInstance();
  private mode: IMode = getMode();
  private search = new Search();

  public async getTask() {
    await this.developPrepare();
    while (true) {
      const taskResult = (await this.tedis.blpop(0, 'search_tasks'))[1];
      if (!taskResult) continue;
      const task: ITASK = JSON.parse(taskResult) as ITASK;
      console.log('task', task);
      let browserWSEndpoint = await this.getBrowserKey(task.user_id);
      console.log('have browserWSEndpoint', browserWSEndpoint)
      // if no browser then create
      if (!browserWSEndpoint) {
        console.log('no browserWSEndpoint')
        if (this.getCreateBrowserLock(task.user_id)) {
          browserWSEndpoint = await this.search.createBrowser(task);
          console.log('createBrowser end')
          this.setBrowserKey(task.user_id, browserWSEndpoint);
          this.deleteBrowserLock(task.user_id);
        } else {
          console.log('not getCreateBrowserLock')
          while (true) {
            browserWSEndpoint = await this.getBrowserKey(task.user_id);
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

  private setBrowserKey(userId: string, broserKey: string) {
    this.tedis.set(`user_id:${userId}:browser_ws_endpoint`, broserKey);
  }

  private async getBrowserKey(userId: string): Promise<string | number> {
    const key = await this.tedis.get(`user_id:${userId}:browser_ws_endpoint`);
    return key
  }

  private async getCreateBrowserLock(userId: string): Promise<boolean> {
    return (await this.tedis.setnx(`user_id:${userId}:browser_ws_create`, '1')) === 1;
  }

  private async deleteBrowserLock(userId: string) {
    await this.tedis.del(`user_id:${userId}:browser_ws_create`);
  }

  private async developPrepare() {
    const keys = [...await this.tedis.keys('*:browser_ws_endpoint'), ...await this.tedis.keys('*:browser_ws_create')]
    console.log('keys', keys)
    keys.forEach(key => {
      this.tedis.del(key)
    });

    if (this.mode === 'develop') {
      const taskResult = JSON.stringify({
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'DAT',
        user_id: '3',
        email: 'haulistix',
        password: 'Shostakovich5',
        criteria: {
          origin: 'Kennewick, WA',
          origin_radius: '100',
          destination: '',
          destination_radius: '100',
          pick_up_date: '2020-04-24',
          equipment: 'Van'
        },
        time: 1587649219
      });
      this.tedis.lpush('search_tasks', taskResult);
    }
  }
}
