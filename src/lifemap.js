import { LeafletLayer } from "deck.gl-leaflet";
import { layer_lifemap } from "./layer_leaflet";
import { layer_heatmap } from "./layer_heatmap";
import { layer_points } from "./layer_points";
import { layer_grid } from "./layer_grid";
import { layer_screengrid } from "./layer_screen_grid";
import { layer_lines } from "./layer_lines";
import { layer_pie } from "./layer_pie";
import { unserialize_data } from "./utils";

import * as L from "leaflet";
import * as Plot from "@observablehq/plot";

import "../css/leaflet.css";
import "../css/lifemap-leaflet.css";

const LEAFLET_LAYERS = ["pie"];

// Main function
export function lifemap(el, data, layers, options = {}) {
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
    // Data
    map.data = undefined;
    // Layers
    map.layers = undefined;

    // Create deck.gl layer
    const deck_layer = new LeafletLayer({ layers: [] });
    map.addLayer(deck_layer);

    // Create layer from layer definition object
    function create_layer(layer_def) {
        // Get data
        const layer_id = layer_def.options.id;
        let layer_data = map.data[layer_id];
        switch (layer_def.layer) {
            case "points":
                return layer_points(map, layer_data, layer_def.options ?? {});
            case "lines":
                return layer_lines(map, layer_data, layer_def.options ?? {});
            case "heatmap":
                return layer_heatmap(map, layer_data, layer_def.options ?? {});
            case "grid":
                return layer_grid(map, layer_data, layer_def.options ?? {});
            case "screengrid":
                return layer_screengrid(map, layer_data, layer_def.options ?? {});
            case "pie":
                return layer_pie(map, layer_data, layer_def.options ?? {});
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
    function update_deck_layers(layers_def) {
        const list = layers_def.filter((d) => !LEAFLET_LAYERS.includes(d.layer));
        let layers = list.length == 0 ? [] : convert_layers(list, map);
        deck_layer.setProps({ layers: layers });
        update_scales(layers);
    }

    // Update leaflet layers from layers definition list
    function update_leaflet_layers(layers_def) {
        const list = layers_def.filter((d) => LEAFLET_LAYERS.includes(d.layer));
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

    map.update_data = function (data) {
        console.log("update data");
        let deserialized_data = {};
        for (let k in data) {
            deserialized_data[k] = unserialize_data(data[k]);
        }
        map.data = deserialized_data;
    };

    map.update_data(data);
    map.update_layers(layers);
    el.map = map;
    return map;
}
