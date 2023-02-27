// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect, givenHttpServerConfig} from '@loopback/testlab';
import {HelloActionApplication} from '../../application.js';
import {main as client} from '../../client.js';
import {main} from '../../server.js';

describe('HelloAction - ed25519', () => {
  let app: HelloActionApplication;
  let signingKey: string;

  before('setupApplication', async () => {
    const restConfig = givenHttpServerConfig({});
    ({app, signingKey} = await main({rest: restConfig}, 'ed25519'));
  });

  after(async () => {
    await app.stop();
  });

  it('invokes action with ecdsa signature', async () => {
    const result = await client(
      app.restServer.url + '/hello-action',
      'ed25519:' + signingKey,
    );
    expect(result.metadata.applicationCommands).to.eql([
      {
        metadata: {
          name: 'HelloAction',
          shortName: 'hello-action',
          supportedEnvs: ['dev', 'qa', 'staging'],
        },
        name: 'hello-action',
        type: 1,
        description: '/hello-action',
        options: [
          {
            name: 'your-name',
            description: "Name of person we're greeting",
            type: 3,
            required: true,
          },
        ],
      },
    ]);
    expect(result.response).to.eql({
      type: 4,
      data: {content: 'Hello, John!', flags: 64},
    });
  });
});
