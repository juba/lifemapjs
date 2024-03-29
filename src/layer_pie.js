import * as L from "leaflet";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

export function layer_pie(map, data, options = {}) {
    let {
        id = undefined,
        x_col = "pylifemap_x",
        y_col = "pylifemap_y",
        levels,
        scheme = undefined,
        label = undefined,
        size = 50,
    } = options;

    scheme = scheme ?? "Tableau10";
    let scale = {
        color: { type: "categorical", scheme: scheme, domain: levels },
        columns: 1,
        className: "lifemap-ol-cat-legend",
        label: label,
    };
    let scale_fn = (key) => Plot.scale(scale).apply(key);

    const zooms = [
        { lifemap: [4, 8], min_zoom: 4 },
        { lifemap: [9, 11], min_zoom: 8 },
        { lifemap: [12, 14], min_zoom: 11 },
        { lifemap: [15, 17], min_zoom: 14 },
        { lifemap: [18, 22], min_zoom: 17 },
        { lifemap: [23, 26], min_zoom: 22 },
        { lifemap: [27, 30], min_zoom: 26 },
        { lifemap: [31, 100], min_zoom: 30 },
    ];

    let layers = zooms.map((z) => {
        let zoom_data = data.filter(
            (d) => (d.zoom >= z.lifemap[0]) & (d.zoom <= z.lifemap[1])
        );
        const markers = zoom_data.map((d) => {
            return pie_marker(d, levels, size, scale_fn, x_col, y_col);
        });

        let layer = L.layerGroup(markers);

        layer.lifemap_ol_layer = true;
        layer.lifemap_ol_id = id + z.lifemap;
        layer.lifemap_ol_scales = [scale];
        layer.lifemap_min_zoom = z.min_zoom;

        return layer;
    });
    return layers;
}

function pie_marker(data, levels, size, scale_fn, x_col, y_col) {
    // Extract levels values from data
    let counts = levels.reduce((obj2, key) => ((obj2[key] = data[key]), obj2), {});
    // Convert to array of {key: , value: } objects
    counts = Object.entries(counts).map((d) => ({ key: d[0], value: d[1] }));

    const el = document.createElement("div");
    let chart = L.divIcon({
        className: "lifemap-pie-divicon",
        iconSize: size,
        html: el,
    });
    pie_chart(el, counts, size, scale_fn);

    let marker = new L.Marker([data[y_col], data[x_col]], {
        icon: chart,
    });
    let popup_content = counts
        .map(
            (d) =>
                `<span style="font-weight: 700; color: ${scale_fn(d.key)}">${
                    d.key
                }:</span> ${d.value}`
        )
        .join("<br>");
    marker.bindPopup(popup_content, { offset: [0, -size / 2] });
    return marker;
}

function pie_chart(el, counts, size, color_scale) {
    // set the dimensions and margins of the graph
    const width = size;
    const height = size;

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    // append the svg object to the div called 'my_dataviz'
    let svg = d3
        .select(el)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Compute the position of each group on the pie:
    let pie = d3
        .pie()
        .sort(null)
        .value(function (d) {
            return d.value;
        });
    let arcs = pie(counts);

    svg.append("g")
        .attr("stroke", "white")
        .selectAll()
        .data(arcs)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => color_scale(d.data.key))
        .attr("stroke", "white")
        .style("stroke-width", "0px")
        .style("opacity", 0.9);
}
