// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  ActionEcdsaSignatureHeader,
  ActionSignatureTimestampHeader,
} from '@collabland/action';
import {getFetch} from '@collabland/common';
import {expect, givenHttpServerConfig} from '@loopback/testlab';
import {HelloActionApplication} from '../../application.js';
import {main as client, MOCKED_INTERACTION} from '../../client.js';
import {main as server} from '../../server.js';

describe('HelloAction - ecdsa', () => {
  let app: HelloActionApplication;
  let signingKey: string;

  before('setupApplication', async () => {
    const restConfig = givenHttpServerConfig({});
    ({app, signingKey} = await server({rest: restConfig}, 'ecdsa'));
  });

  after(async () => {
    await app.stop();
  });

  it('reports error if signature is missing', async () => {
    const fetch = getFetch();
    const res = await fetch(app.restServer.url + '/hello-action/interactions', {
      method: 'post',
      body: JSON.stringify({
        interaction: MOCKED_INTERACTION,
      }),
      headers: {
        [ActionSignatureTimestampHeader]: Date.now().toString(),
      },
    });
    expect(res.status).to.eql(400);
  });

  it('reports error if timestamp is missing', async () => {
    const fetch = getFetch();
    const res = await fetch(app.restServer.url + '/hello-action/interactions', {
      method: 'post',
      body: JSON.stringify({
        interaction: MOCKED_INTERACTION,
      }),
      headers: {
        [ActionEcdsaSignatureHeader]: 'dummy-signature',
      },
    });
    expect(res.status).to.eql(400);
  });

  it('reports error if signature is invalid', async () => {
    const fetch = getFetch();
    const res = await fetch(app.restServer.url + '/hello-action/interactions', {
      method: 'post',
      body: JSON.stringify({
        interaction: MOCKED_INTERACTION,
      }),
      headers: {
        [ActionSignatureTimestampHeader]: Date.now().toString(),
        [ActionEcdsaSignatureHeader]: 'dummy-signature',
      },
    });
    expect(res.status).to.eql(401);
  });

  it('invokes action with ecdsa signature', async () => {
    const result = await client(
      app.restServer.url + '/hello-action',
      signingKey,
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
