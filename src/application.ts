// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar, getEnvVarAsNumber} from '@collabland/common';
import {ApplicationConfig} from '@loopback/core';
import {RestApplication} from '@loopback/rest';
import path from 'path';
import {HelloActionComponent} from './component.js';

/**
 * A demo application to expose REST APIs for Hello action
 */
export class HelloActionApplication extends RestApplication {
  constructor(config?: ApplicationConfig) {
    super(HelloActionApplication.resolveConfig(config));
    this.component(HelloActionComponent);
    this.static('/', path.join(__dirname, '../public'));
  }

  private static resolveConfig(config?: ApplicationConfig): ApplicationConfig {
    return {
      ...config,
      rest: {
        port: getEnvVarAsNumber('PORT', 3000),
        host: getEnvVar('HOST'),
        ...config?.rest,
      },
    };
  }
}
