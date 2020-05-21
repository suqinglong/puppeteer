import { TaskData } from './demoTaskData';
import { SingletonTedis } from './tools/tedis';
import { getMode } from './tools/index';

const count = 1;
const sourceLoad = 'Coyote';
const isRandom = false;
const sourceLoads = ['JB Hunt', 'Sunteck', 'Coyote', 'Uber Freight', 'Landstar', 'CH Robinson', 'TQL'];

export async function prePareTestData() {
    if (getMode() === 'develop') {
        for (let i = 0; i < count; i++) {
            let source = '';
            let random = Math.floor(Math.random() * sourceLoads.length);
            if (isRandom) {
                source = sourceLoads[random];
            } else {
                source = sourceLoad;
            }
            console.log('source: ', source, 'random: ', random);
            let data = TaskData[source] as ITASK;
            data.task_id = 'taskid_' + new Date() + '___' + i;
            await SingletonTedis.pushTask(JSON.stringify(data));
        }
    }
}
