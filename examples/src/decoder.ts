/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
// Tell the typescript compiler that we are here in a WebWorker.
declare let self: Worker & {
    importScripts(..._scripts: string[]): void;
};

self.importScripts("https://cdnjs.cloudflare.com/ajax/libs/three.js/99/three.js");

import { OmvTileDecoderService, OmvTilerService } from "@here/harp-omv-datasource/index-worker";
import { GeoJsonTileDecoderService } from "@here/harp-geojson-datasource/index-worker";

OmvTileDecoderService.start();
OmvTilerService.start(); // TODO: See if this can be separated to get 2 scripts of smaller sizes.
GeoJsonTileDecoderService.start(); // TODO: after adding the features datasource, test if this can be removed, normally yes.
