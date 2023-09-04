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
import {MOCKED_INTERACTION, main as client} from '../../client.js';
import {main as server} from '../../server.js';

describe('HelloAction - ecdsa', () => {
  const body = JSON.stringify(MOCKED_INTERACTION);
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
      body,
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
      body,
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
      body,
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
            autocomplete: true,
          },
        ],
      },
    ]);
    expect(result.response).to.eql({
      type: 4,
      data: {
        content: 'Hello, John!',
        embeds: [
          {
            title: 'Hello Action',
            color: 16106056,
            author: {
              name: 'Collab.Land',
              url: 'https://collab.land',
              icon_url:
                'https://cdn.discordapp.com/app-icons/715138531994894397/8a814f663844a69d22344dc8f4983de6.png',
            },
            description:
              'This is demo Collab.Land action that adds `/hello-action` command to your Discord server. Please click the `Count down` button below to proceed.',
            url: 'https://github.com/abridged/collabland-hello-action/',
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Count down',
                style: 1,
                custom_id: 'hello-action:count-button',
              },
            ],
          },
        ],
        flags: 64,
      },
    });
  });
});
