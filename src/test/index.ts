import { prePareTestData } from './test.config';
import { Tasks } from '../tasks';
import { Log } from '../tools/log';

const log = new Log('TEST');
log.error('error info will be red');

console.error('error');
prePareTestData().then(() => {
    new Tasks().getTask();
});
