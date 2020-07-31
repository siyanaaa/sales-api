import {
  Client, createRestAppClient,
  givenHttpServerConfig,
  TestSandbox
} from '@loopback/testlab';
import path from 'path';
import {SalesApiApplication} from '../..';

export async function setupApplication(fileStorageDirectory?: string): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
  });

  const app = new SalesApiApplication({
    rest: restConfig,
    fileStorageDirectory,
  });

  await app.boot();
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}

export interface AppWithClient {
  app: SalesApiApplication;
  client: Client;
}

export function getSandbox() {
  // dist/.sandbox/<a unique temporary subdir>
  const sandbox = new TestSandbox(path.resolve(__dirname, '../../.sandbox'));
  return sandbox;
}
