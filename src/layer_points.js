import { ScatterplotLayer } from "@deck.gl/layers";
import { guidGenerator } from "./utils";
import { fromLonLat } from "ol/proj.js";
import { CollisionFilterExtension } from "@deck.gl/extensions";

import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

export function layer_points(map, data, options = {}) {
    let {
        id = null,
        x_col = "pylifemap_x",
        y_col = "pylifemap_y",
        radius = null,
        radius_col = null,
        fill_col = null,
        fill_col_cat = null,
        scheme = null,
        opacity = 0.1,
        popup = false,
    } = options;

    let scales = [];
    let popup_obj = map.popup;
    id = `lifemap-ol-${id ?? guidGenerator()}`;

    // Radius column
    let get_radius, radius_scale;
    if (radius_col !== null) {
        const max_value = d3.max(data, (d) => Number(d[radius_col]));
        const min_value = d3.min(data, (d) => Number(d[radius_col]));
        get_radius = (d) =>
            ((Number(d[radius_col]) - min_value) / (max_value - min_value)) * 2;
        radius_scale = radius ?? 4;
    } else {
        get_radius = 1;
        radius_scale = radius ?? 4;
    }

    // Fill color column
    let get_fill, scale, scale_fn;
    if (fill_col !== null) {
        // Determine if scale is categorical or lineat
        if (fill_col_cat === null) {
            fill_col_cat = !(
                ["number", "bigint"].includes(typeof data[0][fill_col]) &
                ([...new Set(data.map((d) => d[fill_col]))].length > 10)
            );
        }
        // Linear color scale
        if (!fill_col_cat) {
            const max_value = d3.max(data, (d) => Number(d[fill_col]));
            const min_value = d3.min(data, (d) => Number(d[fill_col]));
            scheme = scheme ?? "Viridis";
            scale = {
                color: {
                    type: "linear",
                    scheme: scheme,
                    domain: [min_value, max_value],
                },
                className: "lifemap-ol-lin-legend",
                label: fill_col,
            };
            scale_fn = (d) => Plot.scale(scale).apply(Number(d[fill_col]));
        }
        // Categorical color scale
        else {
            scheme = scheme ?? "Tableau10";
            const domain = [...new Set(data.map((d) => d[fill_col]))];
            scale = {
                color: { type: "categorical", scheme: scheme, domain: domain },
                columns: 1,
                className: "lifemap-ol-cat-legend",
                label: fill_col,
            };
            scale_fn = (d) => Plot.scale(scale).apply(d[fill_col]);
        }
        scales.push(scale);
        get_fill = (d) => {
            const col = d3.color(scale_fn(d)).rgb();
            return [col["r"], col["g"], col["b"]];
        };
    }
    // Else : constant color
    else {
        if (!scheme) {
            get_fill = [200, 0, 0];
        } else {
            const col = d3.color(scheme).rgb();
            get_fill = [col["r"], col["g"], col["b"]];
        }
    }

    // Popup
    if (popup) {
        onclick = ({ object }) => {
            if (object === undefined) return;
            let content = `<p><strong>TaxId:</strong> ${object.taxid}<br>`;
            content +=
                radius_col !== null
                    ? `<strong>${radius_col}:</strong> ${object[radius_col]}<br>`
                    : "";
            content += fill_col
                ? `<strong>${fill_col}:</strong> ${object[fill_col]}<br>`
                : "";
            content += "</p>";
            map.popup.content.innerHTML = content;
            map.popup_overlay.setPosition(
                fromLonLat([object.pylifemap_x, object.pylifemap_y])
            );
        };
    }

    // Layer definition
    const layer = new ScatterplotLayer({
        id: id,
        data: data,
        extensions: [new CollisionFilterExtension()],
        collisionGroup: "points",
        radiusUnits: "pixels",
        radiusScale: radius_scale,
        radiusMinPixels: 2,
        getPosition: (d) => [d[x_col], d[y_col], 0],
        getRadius: get_radius,
        getFillColor: get_fill,
        opacity: opacity,
        pickable: popup,
        autoHighlight: false,
        onClick: popup ? onclick : undefined,
        declutter: true,
        updateTriggers: {
            getRadius: get_radius,
            getFillColor: get_fill,
        },
    });

    layer.lifemap_ol_id = id;
    layer.lifemap_ol_scales = scales;
    return layer;
}
