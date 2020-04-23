import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { Tedis } from 'tedis';
import { getMode } from './tools/index';

export class Tasks implements ITasksClass {
  private tedis: Tedis = new SingletonTedis().getInstance();
  private searchMap: { [key: string]: Search } = {};
  private mode: IMode = getMode();

  public async getTask() {
    this.developPrepare();
    while (true) {
      const taskResult = (await this.tedis.blpop(0, 'search_tasks'))[1];
      if (taskResult) {
        const task: ITASK = JSON.parse(taskResult) as ITASK;
        console.log('task', task);
        // if have browser created
        if (this.getBrowserKey(task.user_id)) {
          if (this.searchMap[task.user_id]) {
            await this.searchMap[task.user_id].doTask(task);
          }
        } else {
          // if no browser created then create it
          if (this.getCreateBrowserLock(task.user_id)) {
            const search = new Search()
            this.searchMap[task.user_id] = search;
            this.setBrowserKey(task.user_id);
            await search.prepare();
            await search.doTask(task);
          }
        }
      }
    }
  }

  private setBrowserKey(userId: string) {
    this.tedis.set(`user_id:${userId}:browser_ws_endpoint`, '1');
  }

  private getBrowserKey(userId: string) {
    return this.tedis.get(`user_id:${userId}:browser_ws_endpoint`);
  }

  private async getCreateBrowserLock(userId: string): Promise<boolean> {
    return (await this.tedis.setnx(`user_id:${userId}:browser_ws_create`, '1')) === 1;
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
