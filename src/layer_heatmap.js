import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { guidGenerator } from "./utils";

export function layer_heatmap(data, options = {}) {
    const {
        x_col = "lon",
        y_col = "lat",
        radius = 30,
        intensity = 5,
        threshold = 0.05,
        opacity = 0.5,
        color_range = undefined,
    } = options;

    const layer = new HeatmapLayer({
        data: data,
        id: "heatmap-layer-" + guidGenerator(),
        pickable: false,
        getPosition: (d) => [d[x_col], d[y_col]],
        getWeight: 1,
        radiusPixels: radius,
        intensity: intensity,
        threshold: threshold,
        opacity: opacity,
        colorRange: color_range ?? [
            [255, 255, 178],
            [254, 217, 118],
            [254, 178, 76],
            [253, 141, 60],
            [240, 59, 32],
            [189, 0, 38],
        ],
    });

    return { layer: layer, scales: [] };
}
