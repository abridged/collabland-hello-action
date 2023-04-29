// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {sleep, stringify} from '@collabland/common';
import {
  APIApplicationCommandInteraction,
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
  RESTPostAPIWebhookWithTokenJSONBody,
  buildSimpleResponse,
  getCommandOptionValue,
} from '@collabland/discord';
import {MiniAppManifest} from '@collabland/models';
import {BindingScope, injectable} from '@loopback/core';
import {api} from '@loopback/rest';

/**
 * HelloActionController is a LoopBack REST API controller that exposes endpoints
 * to support Collab Actions for Discord interactions.
 */
@injectable({
  scope: BindingScope.SINGLETON,
})
@api({basePath: '/hello-action'}) // Set the base path to `/hello-action`
export class HelloActionController extends BaseDiscordActionController<APIApplicationCommandInteraction> {
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
   * Handle the Discord interaction
   * @param interaction - Discord interaction with Collab Action context
   * @returns - Discord interaction response
   */
  protected async handle(
    interaction: DiscordActionRequest<APIApplicationCommandInteraction>,
  ): Promise<DiscordActionResponse | undefined> {
    let response: APIInteractionResponse | undefined = undefined;
    let message: string = 'Hello';
    if (interaction.data.type === ApplicationCommandType.ChatInput) {
      // Handle `/hello-action`
      /**
       * Get the value of `your-name` argument for `/hello-action`
       */
      const yourName = getCommandOptionValue(
        interaction as APIChatInputApplicationCommandInteraction,
        'your-name',
      );
      message = `Hello, ${yourName ?? interaction.user?.username ?? 'World'}!`;
      /**
       * Build a simple Discord message private to the user
       */
      response = buildSimpleResponse(message, true);
    } else if (interaction.data.type === ApplicationCommandType.Message) {
      // Handle `Verify` message command
      const discordMsg =
        interaction.data.resolved.messages[interaction.data.target_id];
      const content = stringify({
        hello: discordMsg,
      });
      message = `Hello, ${
        discordMsg.id ?? interaction.user?.username ?? 'World'
      }!`;
      response = buildSimpleResponse(content, true);
    } else if (interaction.data.type === ApplicationCommandType.User) {
      // Handle `Verify` user command
      const discordUser =
        interaction.data.resolved.users[interaction.data.target_id];
      const content = stringify({
        hello: discordUser,
      });
      message = `Hello, ${
        discordUser.username ?? interaction.user?.username ?? 'World'
      }!`;
      response = buildSimpleResponse(content, true);
    }
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
    request: DiscordActionRequest<APIApplicationCommandInteraction>,
    message: string,
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback != null) {
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
      },
      {
        // Handle `Verify` user/message command. This allows `hello-action` to be invoked
        // upon Collab.Land's `Verify` user/message command is triggered by a user
        type: InteractionType.ApplicationCommand,
        names: ['Verify'],
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
          },
        ],
      },
    ];
    return commands;
  }
}
