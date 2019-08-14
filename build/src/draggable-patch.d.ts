/**
 * This patch is used to increase syncronization between Leaflat layer &
 * harp.gl. It delays position update (panning) for the time until frame is rendered.
 * Making a JS queue:
 * [1. Render frame (synchronous, takes time)] - [2. Update position (immediately)]
 */
export {};
