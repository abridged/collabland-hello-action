// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {isMain} from '@collabland/common';
import {main} from './server.js';

export * from './component.js';

if (isMain(import.meta.url)) {
  await main();
}
