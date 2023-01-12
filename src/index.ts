// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {main} from './server.js';

export * from './component.js';

if (require.main === module) {
  main().catch(err => {
    console.error('Fail to start the Hello action: %O', err);
    process.exit(1);
  });
}
