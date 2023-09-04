// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {debugFactory, sleep} from '@collabland/common';
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandSpec,
  ApplicationCommandType,
  BaseDiscordActionController,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  DiscordInteractionPattern,
  InteractionType,
  MessageFlags,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  buildSimpleResponse,
  getCommandOptionValue,
} from '@collabland/discord';
import {MiniAppManifest} from '@collabland/models';
import {BindingScope, injectable} from '@loopback/core';
import {api} from '@loopback/rest';
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandAutocompleteResponse,
  APIInteraction,
  APIMessageComponentInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionResponseType,
  MessageActionRowComponentBuilder,
} from 'discord.js';

const debug = debugFactory('collabland:hello-action');

/**
 * HelloActionController is a LoopBack REST API controller that exposes endpoints
 * to support Collab Actions for Discord interactions.
 */
@injectable({
  scope: BindingScope.SINGLETON,
})
@api({basePath: '/hello-action'}) // Set the base path to `/hello-action`
export class HelloActionController extends BaseDiscordActionController<APIInteraction> {
  /**
   * Expose metadata for the action. The return value is used by Collab.Land `/test-flight` command
   * or marketplace to list this action as a miniapp.
   * @returns
   */
  async getMetadata(): Promise<DiscordActionMetadata> {
    const metadata: DiscordActionMetadata = {
      /**
       * Miniapp manifest
       */
      manifest: new MiniAppManifest({
        appId: 'hello-action',
        developer: 'collab.land',
        name: 'HelloAction',
        platforms: ['discord'],
        shortName: 'hello-action',
        version: {name: '0.0.1'},
        website: 'https://collab.land',
        description: 'An example Collab Action',
      }),
      /**
       * Supported Discord interactions. They allow Collab.Land to route Discord
       * interactions based on the type and name/custom-id.
       */
      supportedInteractions: this.getSupportedInteractions(),
      /**
       * Supported Discord application commands. They will be registered to a
       * Discord guild upon installation.
       */
      applicationCommands: this.getApplicationCommands(),
    };
    return metadata;
  }

  /**
   * Handle the Discord slash commands
   * @param request - Discord interaction with Collab.Land action context
   * @returns - Discord interaction response
   */
  protected async handleApplicationCommand(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
  ): Promise<DiscordActionResponse> {
    switch (request.data.name) {
      case 'hello-action': {
        /**
         * Get the value of `your-name` argument for `/hello-action`
         */
        const yourName = getCommandOptionValue(request, 'your-name');
        const message = `Hello, ${
          yourName ?? request.user?.username ?? 'World'
        }!`;

        const appId = request.application_id;
        const response: APIInteractionResponse = {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: message,
            embeds: [
              new EmbedBuilder()
                .setTitle('Hello Action')
                .setColor('#f5c248')
                .setAuthor({
                  name: 'Collab.Land',
                  url: 'https://collab.land',
                  iconURL: `https://cdn.discordapp.com/app-icons/${appId}/8a814f663844a69d22344dc8f4983de6.png`,
                })
                .setDescription(
                  'This is demo Collab.Land action that adds `/hello-action` ' +
                    'command to your Discord server. Please click the `Count down` button below to proceed.',
                )
                .setURL('https://github.com/abridged/collabland-hello-action/')
                .toJSON(),
            ],
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setLabel(`Count down`)
                    .setStyle(ButtonStyle.Primary)
                    // Set the custom id to start with `hello-action:`
                    .setCustomId('hello-action:count-button'),
                )
                .toJSON(),
            ],
            flags: MessageFlags.Ephemeral,
          },
        };

        // Return the 1st response to Discord
        return response;
      }
      default: {
        return buildSimpleResponse(
          `Slash command ${request.data.name} is not implemented.`,
        );
      }
    }
  }

  /**
   * Handle the Discord message components including buttons
   * @param interaction - Discord interaction with Collab.Land action context
   * @returns - Discord interaction response
   */
  protected async handleMessageComponent(
    request: DiscordActionRequest<APIMessageComponentInteraction>,
  ): Promise<DiscordActionResponse> {
    switch (request.data.custom_id) {
      case 'hello-action:count-button': {
        // Run count down in the background after 1 second
        this.countDown(request).catch(err => {
          console.error(
            'Fail to send followup message to interaction %s: %O',
            request.id,
            err,
          );
        });
      }
    }
    // Instruct Discord that we'll edit the original message later on
    return {
      type: InteractionResponseType.DeferredMessageUpdate,
    };
  }

  /**
   * Run a countdown by updating the original message content
   * @param request
   */
  private async countDown(
    request: DiscordActionRequest<APIMessageComponentInteraction>,
  ) {
    await sleep(1000);
    const message = request.message.content;
    // 5 seconds count down
    for (let i = 5; i > 0; i--) {
      const updated: RESTPatchAPIWebhookWithTokenMessageJSONBody = {
        content: `[${i}s]: **${message}**`,
        components: [], // Remove the `Count down` button
      };
      await this.editMessage(request, updated, request.message.id);
      await sleep(1000);
    }
    // Delete the follow-up message
    await this.deleteMessage(request, request.message.id);
  }

  protected async handleApplicationCommandAutoComplete(
    interaction: DiscordActionRequest<APIApplicationCommandAutocompleteInteraction>,
  ): Promise<APIApplicationCommandAutocompleteResponse | undefined> {
    debug('Autocomplete request: %O', interaction);
    const option = interaction.data.options.find(o => {
      return (
        o.name === 'your-name' &&
        o.type === ApplicationCommandOptionType.String &&
        o.focused
      );
    });
    if (option?.type === ApplicationCommandOptionType.String) {
      const candidates = [
        'Ethereum',
        'Polygon',
        'Optimism',
        'Arbitrum',
        'Flow',
        'Solana',
        'Near',
        'Tezos',
        'Ronin',
        'Xrpl',
      ];
      const prefix = option.value;
      const choices = candidates
        .filter(c => c.toLowerCase().startsWith(prefix.toLowerCase()))
        .map(c => ({name: c, value: c}));

      const res: APIApplicationCommandAutocompleteResponse = {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
          choices,
        },
      };
      debug('Autocomplete response: %O', res);
      return res;
    }
  }

  /**
   * Build a list of supported Discord interactions. The return value is used as filter so that
   * Collab.Land can route the corresponding interactions to this action.
   * @returns
   */
  private getSupportedInteractions(): DiscordInteractionPattern[] {
    return [
      {
        // Handle `/hello-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ['hello-action'],
      },
      {
        // Handle `/hello-action` slash command autocomplete
        type: InteractionType.ApplicationCommandAutocomplete,
        names: ['hello-action'],
      },
      {
        // Handle message components such as buttons
        type: InteractionType.MessageComponent,
        // Use a namespace to catch all buttons with custom id starting with `hello-action:`
        ids: ['hello-action:*'],
      },
    ];
  }

  /**
   * Build a list of Discord application commands. It's possible to use tools
   * like https://autocode.com/tools/discord/command-builder/.
   * @returns
   */
  private getApplicationCommands(): ApplicationCommandSpec[] {
    const commands: ApplicationCommandSpec[] = [
      // `/hello-action <your-name>` slash command
      {
        metadata: {
          name: 'HelloAction',
          shortName: 'hello-action',
          supportedEnvs: ['dev', 'qa', 'staging'],
        },
        name: 'hello-action',
        type: ApplicationCommandType.ChatInput,
        description: '/hello-action',
        options: [
          {
            name: 'your-name',
            description: "Name of person we're greeting",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
          },
        ],
      },
    ];
    return commands;
  }
}
