// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {EnvType, handleFetchResponse, loggers, sleep, stringify, tokenize} from '@collabland/common';
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandSpec,
  ApplicationCommandType,
  BaseDiscordActionController,
  buildSimpleResponse,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  DiscordInteractionPattern,
  getInvokingUser,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  parseApplicationCommand,
  parseMessageComponent,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from '@collabland/discord';
import {MiniAppManifest} from '@collabland/models';
import {BindingScope, injectable} from '@loopback/core';
import {api, HttpErrors} from '@loopback/rest';
import {ComponentType} from 'discord-api-types/v10';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageActionRowComponentBuilder} from 'discord.js';

const {debug} = loggers('collabland:example:hello-action');
export const APPROVE_USER_PERMISSIONS = '$approve-user-permissions';
export const DENY_USER_PERMISSIONS = '$deny-user-permissions';
export const ACTION_REQUESTED_SCOPES = 'action-requested-scopes';
export const ACTION_CLIENT_ID = 'action-client-id';

/**
 * HelloActionController is a LoopBack REST API controller that exposes endpoints
 * to support Collab.Land actions for Discord interactions.
 */
@injectable({
  scope: BindingScope.SINGLETON,
})
@api({basePath: '/hello-action'}) // Set the base path to `/hello-action`
export class HelloActionController extends BaseDiscordActionController<APIChatInputApplicationCommandInteraction> {
  inspectUserPermissionsButton(
    interaction: DiscordActionRequest,
  ) {
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.Button
    ) {
      const {customId} = parseMessageComponent(interaction);
      if (
        customId.startsWith(`${APPROVE_USER_PERMISSIONS}:`) ||
        customId.startsWith(`${DENY_USER_PERMISSIONS}:`)
      ) {
        const [action, interactionId] = customId.split(':');
        // Look up the scopes from the embedded fields
        const scopesField = interaction.message.embeds[0]?.fields?.find(
          f => f.name === ACTION_REQUESTED_SCOPES,
        );
        const scopes = tokenize(scopesField?.value, ' ');
        const appIdField = interaction.message.embeds[0]?.fields?.find(
          f => f.name === ACTION_CLIENT_ID,
        );
        const user = getInvokingUser(interaction);
        return {
          action,
          interactionId,
          scopes,
          appId: appIdField?.value,
          user,
          apiToken: interaction.actionContext?.apiToken,
        };
      }
    }
    return undefined;
  }


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
    const userPerms = this.inspectUserPermissionsButton(interaction);
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
            EnvType.QA,
            EnvType.DEV,
            EnvType.STAGING,
          ],
        },
        name: 'hello-action',
        type: ApplicationCommandType.ChatInput,
        description: '/hello-action',
        options: [
          {
            name: 'your-name',
            description: 'Name of person we\'re greeting',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ];
    return commands;
  }

  async requestUserPermissions(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
    permissions: string[],
  ) {
    const metadata = await this.getMetadata();
    if (metadata.manifest.clientId == null) {
      throw new HttpErrors.BadRequest(`Missing clientId in manifest`);
    }
    const msg = this.buildUserPermissionMessage(
      request.id,
      metadata.manifest.clientId,
      permissions,
    );

    return this.followupMessage(request, msg);
  }

  buildUserPermissionMessage(
    interactionId: string,
    clientId: string,
    scopes: string[],
  ) {
    const builder = new EmbedBuilder()
      .setTitle('Request user permissions')
      .addFields(
        {
          name: ACTION_CLIENT_ID,
          value: clientId,
        },
        {
          name: ACTION_REQUESTED_SCOPES,
          value: scopes.join(' '),
        },
      )
      .setDescription(
        `Action ${clientId} requires the following permissions:\n` +
        scopes.map(p => `- **${p}**`).join('\n'),
      );
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${APPROVE_USER_PERMISSIONS}:${interactionId}`)
          .setLabel(`Approve`)
          .setEmoji({
            name: '✅',
          })
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`${DENY_USER_PERMISSIONS}:${interactionId}`)
          .setLabel(`Deny`)
          .setEmoji({
            name: '❌',
          })
          .setStyle(ButtonStyle.Primary),
      );
    const msg: RESTPostAPIWebhookWithTokenJSONBody = {
      embeds: [builder.toJSON()],
      components: [row.toJSON()],
    };
    return msg;
  }
}
