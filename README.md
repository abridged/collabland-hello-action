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

   ```
   > @collabland/example-hello-action@0.0.1 server
   > node dist/server

   Action signing key: ecdsa:<0x...>
   Hello action is running at http://[::1]:3000
   ```

   Copy the signing key from the console log.

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
