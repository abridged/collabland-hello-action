// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  getEnvVar,
  getFetch,
  handleFetchResponse,
  stringify,
} from '@collabland/common';
import {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionType,
} from 'discord.js';

import {getSigningKeyAndType, invokeWebhook} from '@collabland/action';
import {DiscordActionMetadata, DiscordActionRequest} from '@collabland/discord';

export const MOCKED_INTERACTION: APIApplicationCommandInteraction = {
  application_id: '1',
  channel_id: '1',
  id: '1',
  app_permissions: '1',
  type: InteractionType.ApplicationCommand,
  token: '1',
  version: 1,

  data: {
    id: '1',
    name: '1',
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: 'your-name',
        value: 'John',
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  locale: 'en-US',
};
export async function main(base?: string, signingKey?: string) {
  signingKey =
    signingKey ?? process.argv[2] ?? getEnvVar('COLLABLAND_ACTION_PRIVATE_KEY');
  if (signingKey == null) {
    throw Error('Signing key is not configured');
  }
  const interaction = MOCKED_INTERACTION;
  const fetch = getFetch();
  const url = base ?? 'http://localhost:3000/hello-action';
  const result = await fetch(`${url}/metadata`);
  const metadata = await handleFetchResponse<DiscordActionMetadata>(result);
  if (base == null) {
    console.log('Application commands: %s', stringify(metadata));
  }
  const key = getSigningKeyAndType(signingKey);
  const response = await invokeWebhook<
    APIInteractionResponse,
    DiscordActionRequest
  >(`${url}/interactions`, interaction, key.signingKey, key.signatureType);
  if (base == null) {
    console.log('Discord interaction response: %s', stringify(response));
  }
  return {metadata, response};
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fail to invoke the HelloWorld action: %O', err);
    process.exit(1);
  });
}
