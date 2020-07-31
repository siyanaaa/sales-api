import {createBindingFromClass} from '@loopback/context';
import {CronJob, cronJob} from '@loopback/cron';

@cronJob()
export class CronProvider extends CronJob {
  constructor() {
    const now = new Date();
    now.setMilliseconds(now.getMilliseconds() + 10);
    super({
      name: 'job-B',
      onTick: () => {
        console.log(now);
        // do something
      },
      cronTime: '0 */1 * * *',
      start: true,
    });
  }
}

export const jobBinding = createBindingFromClass(CronProvider);
