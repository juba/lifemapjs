import { LeafletLayer } from "deck.gl-leaflet";
import { layer_lifemap } from "./layer_lifemap";
import { layer_heatmap } from "./layer_heatmap";
import { layer_points } from "./layer_points";
import { layer_grid } from "./layer_grid";
import { layer_screengrid } from "./layer_screen_grid";
import { layer_lines } from "./layer_lines";
import { layer_pie } from "./layer_pie";
import { unserialize_data } from "./utils";

import * as L from "leaflet";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

import "../css/leaflet.css";
import "../css/lifemap-leaflet.css";

const LEAFLET_LAYERS = ["pie"];

// Create layer from layer definition object
function create_layer(layer_def, map = undefined) {
    let data = unserialize_data(layer_def.data);
    data = d3.filter(data, (d) => d["taxid"] != 0);
    switch (layer_def.layer) {
        case "points":
            return layer_points(data, layer_def.options ?? {}, map);
        case "lines":
            return layer_lines(data, layer_def.options ?? {}, map);
        case "heatmap":
            return layer_heatmap(data, layer_def.options ?? {});
        case "grid":
            return layer_grid(data, layer_def.options ?? {});
        case "screengrid":
            return layer_screengrid(data, layer_def.options ?? {});
        case "pie":
            return layer_pie(data, layer_def.options ?? {});
        default:
            console.warn(`Invalid layer type: ${layer_def.layer}`);
            return undefined;
    }
}

function convert_layers(layers_list, map) {
    // Convert layer definitions to layers
    layers_list = Array.isArray(layers_list) ? layers_list : [layers_list];
    layers_list = layers_list.map((l) => create_layer(l, map));
    return layers_list.flat();
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
        map.leaflet_layers = convert_layers(list, map);
        filter_leaflet_layers(map);
        update_scales(map.leaflet_layers);
    }

    function filter_leaflet_layers(map) {
        if (map.leaflet_layers === undefined) return;
        const zoom = map.getZoom();
        map.leaflet_layers.forEach((l) => {
            if (l.lifemap_min_zoom !== undefined) {
                if (l.lifemap_min_zoom <= zoom) {
                    map.addLayer(l);
                } else {
                    map.removeLayer(l);
                }
            }
        });
    }

    map.on("zoomend", () => {
        filter_leaflet_layers(map);
    });

    map.update_layers = function (layers_list) {
        update_deck_layers(layers_list);
        update_leaflet_layers(layers_list);
    };

    map.update_layers(layers_list);
    return map;
}
