// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-hello-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Component} from '@loopback/core';
import {HelloActionController} from './actions/hello-action.controller.js';

/**
 * Register all services including command handlers, job runners and services
 */
export class HelloActionComponent implements Component {
  controllers = [HelloActionController];
}
