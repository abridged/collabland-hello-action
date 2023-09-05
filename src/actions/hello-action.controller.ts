// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  EnvType,
  handleFetchResponse,
  loggers,
  sleep,
  stringify,
} from '@collabland/common';
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
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
  buildSimpleResponse,
  inspectUserPermissionsButton,
  parseApplicationCommand,
} from '@collabland/discord';
import {MiniAppManifest} from '@collabland/models';
import {BindingScope, injectable} from '@loopback/core';
import {api} from '@loopback/rest';

const {debug} = loggers('collabland:example:hello-action');

/**
 * HelloActionController is a LoopBack REST API controller that exposes endpoints
 * to support Collab.Land actions for Discord interactions.
 */
@injectable({
  scope: BindingScope.SINGLETON,
})
@api({basePath: '/hello-action'}) // Set the base path to `/hello-action`
export class HelloActionController extends BaseDiscordActionController<APIChatInputApplicationCommandInteraction> {
  /**
   * Expose metadata for the action
   * @returns
   */
  async getMetadata(): Promise<DiscordActionMetadata> {
    const metadata: DiscordActionMetadata = {
      /**
       * Miniapp manifest
       */
      manifest: new MiniAppManifest({
        appId: 'hello-action',
        clientId: 'collabland_demo',
        developer: 'collab.land',
        supportedEnvs: [
          EnvType.QA,
          EnvType.TEST,
          EnvType.PROD,
          EnvType.DEV,
          EnvType.STAGING,
        ],
        name: 'HelloAction',
        platforms: ['discord'],
        shortName: 'hello-action',
        version: {name: '0.0.1'},
        website: 'https://collab.land',
        description: 'An example Collab.Land action',
        releasedDate: Math.floor(Date.now() / 1000), // secs
        shortDescription: 'An example Collab.Land action',
        thumbnails: [],
        price: 0,
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
      requiredContext: ['isCommunityAdmin', 'gmPassAddress', 'guildName'],
    };
    return metadata;
  }

  /**
   * Handle the Discord interaction
   * @param interaction - Discord interaction with Collab.Land action context
   * @returns - Discord interaction response
   */
  protected async handle(
    interaction: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
  ): Promise<DiscordActionResponse> {
    const userPerms = inspectUserPermissionsButton(interaction);
    debug('User permissions: %O', userPerms);
    if (userPerms != null) {
      const apiToken = userPerms.apiToken;
      if (apiToken != null && interaction.actionContext?.callbackUrl != null) {
        const url = new URL(interaction.actionContext?.callbackUrl);
        const res = await this.fetch(url.origin + '/account/me', {
          headers: {
            authorization: `Bearer ${apiToken}`,
          },
        });
        const user = await handleFetchResponse(res);
        console.log('User profile: %O', user);
        const task = async () => {
          await sleep(1000);
          await this.followupMessage(interaction, {content: stringify(user)});
        };
        task().catch(err => {
          console.error('Fail to send followup message: %O', err);
        });
      }
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          embeds: [
            {
              title: 'User response for permissions',
              fields: [
                {
                  name: 'user',
                  value:
                    userPerms.user?.username +
                    '#' +
                    userPerms.user?.discriminator,
                },
                {
                  name: 'action',
                  value: userPerms.action,
                  inline: true,
                },
                {
                  name: 'interactionId',
                  value: userPerms.interactionId,
                  inline: true,
                },
                {
                  name: 'scopes',
                  value: userPerms.scopes.join(' '),
                  inline: true,
                },
              ],
            },
          ],
        },
      };
    }
    /**
     * Get the value of `your-name` argument for `/hello-action`
     */
    const yourName = parseApplicationCommand(interaction).args['your-name'];
    const message = `Hello, ${
      yourName ?? interaction.user?.username ?? 'World'
    }!`;
    /**
     * Build a simple Discord message private to the user
     */
    const response: APIInteractionResponse = buildSimpleResponse(message, true);
    /**
     * Allow advanced followup messages
     */
    this.followup(interaction, message).catch(err => {
      console.error(
        'Fail to send followup message to interaction %s: %O',
        interaction.id,
        err,
      );
    });
    // Return the 1st response to Discord
    return response;
  }

  private async followup(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
    message: string,
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback != null) {
      await this.requestUserPermissions(request, ['user:read', 'user:write']);
      const followupMsg: RESTPostAPIWebhookWithTokenJSONBody = {
        content: `Follow-up: **${message}**`,
        flags: MessageFlags.Ephemeral,
      };
      await sleep(1000);
      let msg = await this.followupMessage(request, followupMsg);
      await sleep(1000);
      // 5 seconds count down
      for (let i = 5; i > 0; i--) {
        const updated: RESTPatchAPIWebhookWithTokenMessageJSONBody = {
          content: `[${i}s]: **${message}**`,
        };
        msg = await this.editMessage(request, updated, msg?.id);
        await sleep(1000);
      }
      // Delete the follow-up message
      await this.deleteMessage(request, msg?.id);
    }
  }

  /**
   * Build a list of supported Discord interactions
   * @returns
   */
  private getSupportedInteractions(): DiscordInteractionPattern[] {
    return [
      {
        // Handle `/hello-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ['hello-action'],
        commandType: ApplicationCommandType.ChatInput,
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
          supportedEnvs: [
            EnvType.DEV,
            EnvType.QA,
            EnvType.STAGING,
          ],
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
          },
        ],
      },
    ];
    return commands;
  }
}
