import { GridLayer } from "@deck.gl/aggregation-layers";
import { guidGenerator } from "./utils";

export function layer_grid(map, data, options = {}) {
    let {
        id = undefined,
        x_col = "pylifemap_x",
        y_col = "pylifemap_y",
        cell_size = 200,
        opacity = 0.5,
        extruded = false,
    } = options;

    id = `lifemap-leaflet-${id ?? guidGenerator()}`;

    const layer = new GridLayer({
        data: data,
        id: id,
        pickable: false,
        getPosition: (d) => [d[x_col], d[y_col]],
        getWeight: 1,
        cellSize: cell_size,
        extruded: extruded,
        opacity: opacity,
    });

    layer.lifemap_leaflet_id = id;
    return layer;
}
