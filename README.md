# @collabland/example-hello-action

This example illustrates how to implement a Collab.Land action for Discord
interactions.

## Architectural diagram

![collabland-hello-action](./docs/collabland-hello-action.png)

## Build and Test

1. Build

   ```sh
   npm run build
   ```

2. Test

   ```sh
   npm test
   ```

## Try out

1. Run the hello-action server

   ```sh
   npm run server
   ```

   By default, the server will generate an ECDSA key for signature verification
   between the client (signing the request payload) and the server (verifying
   the signature of the request).

   To run the hello-action server with Collab.Land's public key for signature
   verification, set the environment variable:

   ```sh
   export COLLABLAND_ACTION_PUBLIC_KEY=<public-key>
   ```

   or

   ```sh
   npm run server -- ecdsa
   npm run server -- ed25519
   npm run server -- <public-key>
   ```

   ```
   > @collabland/example-hello-action@0.0.1 server
   > node dist/server

   Action signing key: ecdsa:<0x...>
   Hello action is running at http://[::1]:3000
   ```

   Copy the signing key (including `ecdsa:` or `ed25519:`) from the console log.

2. Run the hello-action test client

   ```sh
   npm run client -- <server-signing-key>
   ```

## Run hello-action with Collab.Land QA bot

To run the server for Collab.Land QA bot:

1. Fetch action public keys for Collab.Land QA

Open https://api-qa.collab.land/config from your browser:

```json
{
  "discordClientId": "715138531994894397",
  "actionEcdsaPublicKey": "0x043b30458cf281461de368fd591b4c9b511a1b9263cea48517f41217ba14aa714fefea1adcfc9d8ae7ec0b4f7272f472178a5e674a1229ce5d2f2526244d62fbd8",
  "actionEd25519PublicKey": "DhF7T98EBmH1ZFmdGJvBhkmdn3BfAqc3tz8LxER8VH2q"
}
```

2. Download and install `ngrok` from https://ngrok.com/download

3. Run hello-action server

   ```sh
   npm run server -- DhF7T98EBmH1ZFmdGJvBhkmdn3BfAqc3tz8LxER8VH2q
   ```

   From a different terminal window:

   ```sh
   ngrok http 3000
   ```

4. Copy the `https` URL, for example (yours will be **different**):

   ```
   https://0c49-2601-646-9e00-80-3964-47d-7146-ff13.ngrok.io/
   ```

   Append `/hello-action` to get the full URL.

5. Follow instructions at
   https://dev.collab.land/docs/upstream-integrations/build-a-miniapp#setting-up-the-testflight-mini-app-on-discord

## Build your own action

1. Use `src/hello-action.ts` as the template
2. Define action metadata for Discord
3. Implement the `handle()` method
   - Process various Discord interactions
   - Generate the first interaction response
   - Send/update/delete interaction messages

For more details, see
https://dev.collab.land/docs/upstream-integrations/build-a-custom-action.
