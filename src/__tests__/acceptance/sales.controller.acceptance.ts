import {Client, expect, TestSandbox} from '@loopback/testlab';
import path from 'path';
import {SalesApiApplication} from '../..';
import {getSandbox, setupApplication} from './test-helper';


describe('SalesController', () => {
  let sandbox: TestSandbox;
  let app: SalesApiApplication;
  let client: Client;

  before(resetSandbox);
  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });
  after(resetSandbox);

  it('invoke POST /sales/record', async () => {
    const FIXTURES = path.resolve(__dirname, '../../../fixtures');
    await client
      .post('/sales/record')
      .attach('testFile1', path.resolve(FIXTURES, 'dummy.csv'), {
        filename: 'dummy.csv',
        contentType: 'multipart/form-data',
      })
      .expect(200);
  });

  it('invokes GET /sales/report/{date}', async () => {
    const res = await client.get('/sales/report/1970-07-30').expect(200);
    expect(res.body).to.have.lengthOf(0);
  });

  it('fails GET /sales/report/{date}', async () => {
     await client.get('/sales/report/lalala').expect(500);
  });

  it('invokes GET /sales/report/{startDate}/{endDate}', async () => {
    await client.get('/sales/report/1970-07-01/2020-12-30').expect(200);
  });

  it('fails GET /sales/report/startDate}/{endDate}', async () => {
    await client.get('/sales/report/lalala/ceva').expect(500);
  });

  /*
   ============================================================================
   TEST HELPERS
   ============================================================================
  */

  async function resetSandbox() {
    sandbox = getSandbox();
    await sandbox.reset();
  }

});
