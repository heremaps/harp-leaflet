/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
// Tell the typescript compiler that we are here in a WebWorker.
declare let self: Worker & {
    importScripts(..._scripts: string[]): void;
};

self.importScripts("https://unpkg.com/three@0.110.0/build/three.min.js");

import { OmvTileDecoderService, OmvTilerService } from "@here/harp-omv-datasource/index-worker";

OmvTileDecoderService.start();
OmvTilerService.start();
