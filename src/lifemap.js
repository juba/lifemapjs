import { Deck, MapView } from "@deck.gl/core";
import * as L from "leaflet";
import * as Plot from "@observablehq/plot";

import { LeafletLayer } from "deck.gl-leaflet";
import { layer_lifemap } from "./layer_lifemap";
import { layer_heatmap } from "./layer_heatmap";
import { layer_scatter } from "./layer_scatter";
import { layer_grid } from "./layer_grid";
import { layer_screengrid } from "./layer_screen_grid";
import { layer_lines } from "./layer_lines";
import * as d3 from "d3";

import "../node_modules/leaflet/dist/leaflet.css";
import "../css/lifemap-leaflet.css";

function create_layer(layer_def, map = undefined, popup = undefined) {
    layer_def.data = d3.filter(layer_def.data, (d) => d["taxid"] != 0);
    switch (layer_def.layer) {
        case "points":
            return layer_scatter(layer_def.data, layer_def.options ?? {}, map, popup);
        case "lines":
            return layer_lines(layer_def.data, layer_def.options ?? {}, map, popup);
        case "heatmap":
            return layer_heatmap(layer_def.data, layer_def.options ?? {});
        case "grid":
            return layer_grid(layer_def.data, layer_def.options ?? {});
        case "screengrid":
            return layer_screengrid(layer_def.data, layer_def.options ?? {});
        default:
            console.warn(`Invalid layer type: ${layer_def.layer}`);
            return undefined;
    }
}

export function lifemap(el, layers, options = {}) {
    const {
        zoom = 5,
        legend_position = "bottomright",
        legend_width = undefined,
    } = options;
    let map = layer_lifemap(el, { zoom: zoom });
    let popup = L.popup({ closeOnClick: false });

    let layers_list = Array.isArray(layers) ? layers : [layers];
    layers_list = layers_list.map((l) => create_layer(l, map, popup));
    layers = layers_list.map((l) => l.layer);
    let scales = layers_list.map((l) => l.scales).flat();

    const deckLayer = new LeafletLayer({
        views: [
            new MapView({
                repeat: true,
            }),
        ],
        layers: layers,
    });
    map.addLayer(deckLayer);

    if (scales.length > 0) {
        // Remove duplicated scales
        const unique_scales = {};
        scales.forEach((obj) => {
            const key = JSON.stringify(obj);
            unique_scales[key] = obj;
        });

        // Create Legend control
        let legend = L.control({ position: legend_position });
        legend.onAdd = (map) => {
            let div_legend = document.createElement("div");
            div_legend.className = "lifemap-legend";
            if (legend_width) {
                div_legend.style.width = legend_width;
            }
            // Add legends
            for (let scale of Object.values(unique_scales)) {
                if (legend_width) scale.width = legend_width;
                div_legend.append(Plot.legend(scale));
            }
            return div_legend;
        };
        legend.addTo(map);
    }
}
