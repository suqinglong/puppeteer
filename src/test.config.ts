import { TaskData } from './demoTaskData';
import { SingletonTedis } from './tools/tedis';
import { getMode } from './tools/index';

console.log('in test');

export async function prePareTestData () {
  if (getMode() === 'develop') {
    await SingletonTedis.deleteKeys();
    const n = 10
    for (let i = 0; i < n; i++) {
      await SingletonTedis.pushTask(JSON.stringify(TaskData['JB Hunt']));
    }
  }
}