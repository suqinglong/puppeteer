import { TaskData } from './demoTaskData';
import { SingletonTedis } from './tools/tedis';
import { Config } from './tools/index';

const count = 10;
const sourceLoad = 'Landstar';
const isRandom = true;
const isAll = true
const sourceLoads = [
    'Allenlund',
    'TQL',
    'JB Hunt',
    'Sunteck',
    'Coyote',
    'Uber Freight',
    'Landstar',
    'CH Robinson',
    'TQL',
    'DAT',
    'Werner'
];

export async function prePareTestData() {
    if (Config.isDevelop) {
        if (isAll) {
            for (let i = 0; i < sourceLoads.length; i++) {
                let data = TaskData[sourceLoads[i]] as ITASK;
                data.task_id = 'taskid_' + new Date() + '___' + i;
                await SingletonTedis.pushTask(JSON.stringify(data));
            }
        } else {
            for (let i = 0; i < count; i++) {
                let source = '';
                let random = Math.floor(Math.random() * sourceLoads.length);
                if (isRandom) {
                    source = sourceLoads[random];
                } else {
                    source = sourceLoad;
                }
                let data = TaskData[source] as ITASK;
                data.task_id = 'taskid_' + new Date() + '___' + i;
                await SingletonTedis.pushTask(JSON.stringify(data));
            }
        }
    }
}
