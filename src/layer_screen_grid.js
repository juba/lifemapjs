import { ScreenGridLayer } from "@deck.gl/aggregation-layers";
import { guidGenerator } from "./utils";

export function layer_screengrid(data, options = {}) {
    let { id = undefined, x_col = "lon", y_col = "lat", cell_size = 30 } = options;

    const layer = new ScreenGridLayer({
        data: data,
        id: "screengrid-layer-" + guidGenerator(),
        pickable: false,
        getPosition: (d) => [d[x_col], d[y_col]],
        getWeight: 1,
        cellSizePixels: cell_size,
        extruded: false,
        opacity: 0.5,
    });

    layer.lifemap_leaflet_id = id;
    return layer;
}
