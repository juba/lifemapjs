import { GridLayer } from "@deck.gl/aggregation-layers";
import { guidGenerator } from "./utils";

export function layer_grid(data, options = {}) {
    const { x_col = "lon", y_col = "lat", cell_size = 200 } = options;

    const layer = new GridLayer({
        data: data,
        id: "grid-layer-" + guidGenerator(),
        pickable: false,
        getPosition: (d) => [d[x_col], d[y_col]],
        getWeight: 1,
        cellSize: cell_size,
        extruded: false,
        opacity: 0.5,
    });

    return { layer: layer, scales: [] };
}
