import { ScatterplotLayer } from "@deck.gl/layers";
import { guidGenerator } from "./utils";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

export function layer_scatter(data, options = {}, map, popup_obj = undefined) {
    let {
        x_col = "lon",
        y_col = "lat",
        radius = undefined,
        radius_col = undefined,
        fill_col = undefined,
        fill_col_cat = undefined,
        scheme = undefined,
        opacity = 0.1,
        popup = false,
    } = options;
    let scales = [];

    // radius
    let get_radius, radius_scale;
    if (radius_col !== undefined) {
        const max_value = d3.max(data, (d) => d[radius_col]);
        const min_value = d3.min(data, (d) => d[radius_col]);
        get_radius = (d) => (d[radius_col] - min_value) / max_value;
        radius_scale = radius ?? 30;
    } else {
        get_radius = 1;
        radius_scale = radius ?? 4;
    }

    // fill color
    let get_fill, scale;
    if (fill_col !== undefined) {
        if (fill_col_cat === undefined) {
            fill_col_cat = !(
                ["number", "bigint"].includes(typeof data[0][fill_col]) &
                ([...new Set(data.map((d) => d[fill_col]))].length > 10)
            );
        }
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
                className: "lifemap-leaflet-lin-legend",
                label: fill_col,
            };
        } else {
            scheme = scheme ?? "Tableau10";
            const domain = [...new Set(data.map((d) => d[fill_col]))];
            scale = {
                color: { type: "categorical", scheme: scheme, domain: domain },
                columns: 1,
                className: "lifemap-leaflet-cat-legend",
                label: fill_col,
            };
        }
        scales.push(scale);
        get_fill = (d) => {
            const col = d3.color(Plot.scale(scale).apply(Number(d[fill_col]))).rgb();
            return [col["r"], col["g"], col["b"]];
        };
    } else {
        get_fill = [200, 0, 0];
    }

    // Popup
    if (popup) {
        onclick = ({ object }) => {
            if (object === undefined) return;
            let content = `<p><strong>TaxId:</strong> ${object.taxid}<br>`;
            content +=
                radius_col !== undefined
                    ? `<strong>${radius_col}:</strong> ${object[radius_col]}<br>`
                    : "";
            content += fill_col
                ? `<strong>${fill_col}:</strong> ${object[fill_col]}<br>`
                : "";
            content += "</p>";
            popup_obj = popup_obj.setLatLng([object.lat, object.lon]).setContent(content);
            map.openPopup(popup_obj);
        };
    }
    const layer = new ScatterplotLayer({
        id: "scatter-layer-" + guidGenerator(),
        data: data,
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
    });

    return { layer: layer, scales: scales };
}
