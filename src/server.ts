// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  ActionSignatureType,
  generateEcdsaKeyPair,
  generateEd25519KeyPair,
} from '@collabland/action';
import {setEnvVar} from '@collabland/common';
import {ApplicationConfig} from '@loopback/core';
import {HelloActionApplication} from './application.js';

export async function main(
  config: ApplicationConfig = {},
  signatureType?: ActionSignatureType,
) {
  const sigType = signatureType ?? process.argv[2] ?? 'ecdsa';
  let signingKey = undefined;
  switch (sigType) {
    case 'ecdsa': {
      const keyPair = generateEcdsaKeyPair();
      signingKey = keyPair.privateKey;
      setEnvVar('COLLABLAND_ACTION_PUBLIC_KEY', keyPair.publicKey, true);
      if (config.rest == null) {
        console.log('Action signing key: %s', `${sigType}:${signingKey}`);
      }
      break;
    }
    case 'ed25519': {
      const keyPair = generateEd25519KeyPair();
      signingKey = keyPair.privateKey;
      setEnvVar('COLLABLAND_ACTION_PUBLIC_KEY', keyPair.publicKey, true);
      if (config.rest == null) {
        console.log('Action signing key: %s', `${sigType}:${signingKey}`);
      }
      break;
    }
    default: {
      throw new Error(
        `Signature type not supported: ${sigType}. Please use ecdsa or ed25519.`,
      );
    }
  }
  const app = new HelloActionApplication(config);
  await app.start();

  const url = app.restServer.url;
  if (config.rest == null) {
    console.log(`HelloWorld action is running at ${url}`);
  }
  return {app, signingKey, signatureType: sigType};
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fail to start the HelloWorld action: %O', err);
    process.exit(1);
  });
}
