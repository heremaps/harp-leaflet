/*
 * Copyright (C) 2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * This patch is used to increase syncronization between Leaflat layer &
 * harp.gl. It delays position update (panning) for the time until frame is rendered.
 * Making a JS queue:
 * [1. Render frame (synchronous, takes time)] - [2. Update position (immediately)]
 */

import { Draggable } from "leaflet";

// @ts-ignore
const oldUpdatePostition = Draggable.prototype._updatePosition;

// @ts-ignore
Draggable.prototype._updatePosition = function(...args) {
    setTimeout(() => {
        oldUpdatePostition.apply(this, args);
    }, 0);
};
