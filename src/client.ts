// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getFetch, handleFetchResponse, stringify} from '@collabland/common';
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  GuildMemberFlags,
  InteractionType,
} from 'discord.js';

import {
  getActionKeyAndType,
  getActionPrivateKey,
  invokeWebhook,
} from '@collabland/action';
import {DiscordActionMetadata, DiscordActionRequest} from '@collabland/discord';

/**
 * The interaction simulates `/hello-action John`
 */
export const MOCKED_INTERACTION: APIChatInputApplicationCommandInteraction = {
  app_permissions: '4398046511103',
  application_id: '715138531994894397',
  channel_id: '941347407302651955',
  data: {
    guild_id: '929214449733230592',
    id: '1063553299804078151',
    name: 'hello-action',
    options: [
      {
        name: 'your-name',
        type: ApplicationCommandOptionType.String,
        value: 'John',
      },
    ],
    type: ApplicationCommandType.ChatInput,
  },
  guild_id: '929214449733230592',
  guild_locale: 'en-US',
  id: '1064236313630482482', // interaction id
  locale: 'en-US',
  member: {
    avatar: null,
    communication_disabled_until: null,
    deaf: false,
    joined_at: '2022-01-08T03:26:28.791000+00:00',
    mute: false,
    nick: null,
    pending: false,
    permissions: '4398046511103',
    premium_since: null,
    roles: [],
    flags: GuildMemberFlags.CompletedOnboarding,
    user: {
      avatar: 'a_8a814f663844a69d22344dc8f4983de6',
      discriminator: '0000',
      id: '781898624464453642',
      public_flags: 0,
      username: 'Test User',
    },
  },
  token: '', // interaction token intentionally removed by Collab.Land
  type: InteractionType.ApplicationCommand,
  version: 1,
};

export async function main(base?: string, signingKey?: string) {
  signingKey = signingKey ?? process.argv[2];
  const key =
    signingKey != null
      ? getActionKeyAndType(signingKey)
      : getActionPrivateKey();

  const interaction = MOCKED_INTERACTION;
  const fetch = getFetch();
  const url = base ?? 'http://localhost:3000/hello-action';
  const result = await fetch(`${url}/metadata`);
  const metadata = await handleFetchResponse<DiscordActionMetadata>(result);
  if (base == null) {
    console.log('Application commands: %s', stringify(metadata));
  }
  const response = await invokeWebhook<
    APIInteractionResponse,
    DiscordActionRequest
  >(`${url}/interactions`, interaction, key.key, key.type);
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
