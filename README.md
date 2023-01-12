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

## Build your own action

1. Use `src/hello-action.ts` as the template
2. Define action metadata for Discord
3. Implement the `handle()` method
   - Process various Discord interactions
   - Generate the first interaction response
   - Send/update/delete interaction messages
