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
        console.log('bonjour, je cours toutes les heures ');
        // Todo trigger /sales/record
      },
      cronTime: '0 */1 * * *',
      start: true,
    });
  }
}

export const jobBinding = createBindingFromClass(CronProvider);
