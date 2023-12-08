import { MapView } from "@deck.gl/core";
import { LeafletLayer } from "deck.gl-leaflet";
import { layer_lifemap } from "./layer_lifemap";
import { layer_heatmap } from "./layer_heatmap";
import { layer_scatter } from "./layer_scatter";
import { layer_grid } from "./layer_grid";
import { layer_screengrid } from "./layer_screen_grid";
import { layer_lines } from "./layer_lines";
import { layer_pie } from "./layer_pie";

import * as L from "leaflet";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

import "../node_modules/leaflet/dist/leaflet.css";
import "../css/lifemap-leaflet.css";

const LEAFLET_LAYERS = ["pie"];

// Create layer from layer definition object
function create_layer(layer_def, map = undefined) {
    layer_def.data = d3.filter(layer_def.data, (d) => d["taxid"] != 0);
    switch (layer_def.layer) {
        case "points":
            return layer_scatter(layer_def.data, layer_def.options ?? {}, map);
        case "lines":
            return layer_lines(layer_def.data, layer_def.options ?? {}, map);
        case "heatmap":
            return layer_heatmap(layer_def.data, layer_def.options ?? {});
        case "grid":
            return layer_grid(layer_def.data, layer_def.options ?? {});
        case "screengrid":
            return layer_screengrid(layer_def.data, layer_def.options ?? {});
        case "pie":
            return layer_pie(layer_def.data, layer_def.options ?? {});
        default:
            console.warn(`Invalid layer type: ${layer_def.layer}`);
            return undefined;
    }
}

function convert_layers(layers_list, map) {
    // Convert layer definitions to layers
    layers_list = Array.isArray(layers_list) ? layers_list : [layers_list];
    return layers_list.map((l) => create_layer(l, map));
}

// Main function
export function lifemap(el, layers_list, options = {}) {
    const {
        zoom = 5,
        legend_position = "bottomright",
        legend_width = undefined,
    } = options;

    // Base Leaflet layer
    let map = layer_lifemap(el, { zoom: zoom });
    // Popup object
    map.popup = L.popup({ closeOnClick: false });
    // Legend control
    map.legend = L.control({ position: legend_position });
    // Current scales
    map.scales = undefined;

    // Create deck.gl layer
    const deck_layer = new LeafletLayer({ layers: [] });
    map.addLayer(deck_layer);

    // Create legend from scales
    function update_legend(scales) {
        if (scales.length == 0) {
            map.legend.remove();
            return;
        }

        map.legend.onAdd = (map) => {
            let div_legend = document.createElement("div");
            div_legend.className = "lifemap-legend";
            if (legend_width) {
                div_legend.style.width = legend_width;
            }
            // Add legends
            for (let scale of Object.values(scales)) {
                if (legend_width) scale.width = legend_width;
                div_legend.append(Plot.legend(scale));
            }
            return div_legend;
        };

        map.legend.addTo(map);
    }

    // Update scales from layers
    function update_scales(layers) {
        let scales = layers
            .filter((d) => d.lifemap_leaflet_scales)
            .map((d) => d.lifemap_leaflet_scales)
            .flat();
        // Remove duplicated scales
        let unique_scales = {};
        scales.forEach((obj) => {
            const key = JSON.stringify(obj);
            unique_scales[key] = obj;
        });
        unique_scales = Object.values(unique_scales);

        if (map.scales != JSON.stringify(unique_scales)) {
            update_legend(unique_scales);
            map.scales = JSON.stringify(unique_scales);
        }
    }

    // Update deck layers from layers definition list
    function update_deck_layers(layers_list) {
        const list = layers_list.filter((d) => !LEAFLET_LAYERS.includes(d.layer));
        if (list.length == 0) return;
        let layers = convert_layers(list, map);
        deck_layer.setProps({ layers: layers });
        update_scales(layers);
    }

    // Update leaflet layers from layers definition list
    function update_leaflet_layers(layers_list) {
        const list = layers_list.filter((d) => LEAFLET_LAYERS.includes(d.layer));
        if (list.length == 0) return;
        // TODO : not optimized
        map.eachLayer((l) => {
            if (l.lifemap_leaflet_layer) {
                l.remove();
            }
        });
        let layers = convert_layers(list, map);
        layers.forEach((l) => l.addTo(map));
        update_scales(layers);
    }

    map.update = function (layers_list) {
        update_deck_layers(layers_list);
        update_leaflet_layers(layers_list);
    };

    map.update(layers_list);

    return map;
}
