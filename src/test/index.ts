import { prePareTestData } from './test.config';
import { Tasks } from '../tasks';

prePareTestData().then(() => {
    new Tasks().getTask();
});
