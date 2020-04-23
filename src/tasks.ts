import { Search } from './search';
import { SingletonTedis } from './tools/tedis';
import { Tedis } from 'tedis';

export class Tasks implements ITasksClass {
  private tedis: Tedis = new SingletonTedis().getInstance();
  private searchMap: { [key: string]: Search } = {}

  public async getTask() {
    while (true) {
      const taskResult = (await this.tedis.blpop(0, 'search_tasks'))[1];
      if (taskResult) {
        const task: ITASK = JSON.parse(taskResult) as ITASK;
        if (!this.searchMap[task.user_id]) {
          this.searchMap[task.user_id] = new Search()
          await this.searchMap[task.user_id].prepare()
        }
        await this.searchMap[task.user_id].doTask(task)
      }
    }
  }
}