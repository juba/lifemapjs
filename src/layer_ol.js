// OL
import Map from "ol/Map";
import { Tile as TileLayer } from "ol/layer";
import View from "ol/View";
import XYZ from "ol/source/XYZ";
import Overlay from "ol/Overlay.js";

import { DragPan, MouseWheelZoom, defaults } from "ol/interaction.js";
import Kinetic from "ol/Kinetic.js";

import { fromLonLat } from "ol/proj";

function create_popup() {
    const container = document.createElement("div");
    container.id = "lifemap-popup";
    const content = document.createElement("div");
    content.id = "lifemap-popup-content";
    container.appendChild(content);
    const closer = document.createElement("div");
    closer.id = "lifemap-popup-closer";
    closer.innerHTML = "<a href='#'>✕</a>";
    container.appendChild(closer);

    container.content = content;
    container.closer = closer;

    return container;
}

export function layer_ol(el, deck_layer, options) {
    const { zoom = 5, minZoom = 4, maxZoom = 32 } = options;

    // Popup object
    const popup = create_popup();
    const popup_overlay = new Overlay({
        element: popup,
        autoPan: {
            animation: {
                duration: 250,
            },
        },
    });

    popup.closer.onclick = () => {
        popup_overlay.setPosition(undefined);
        popup.closer.blur();
        return false;
    };

    const view = new View({
        center: fromLonLat([0, -4.226497]),
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
        enableRotation: false,
    });
    const tile_layer = new TileLayer({
        source: new XYZ({
            url: "https://lifemap.univ-lyon1.fr/osm_tiles/{z}/{x}/{y}.png",
        }),
    });
    let map = new Map({
        interactions: defaults({ dragPan: false, mouseWheelZoom: false }).extend([
            new DragPan({ duration: 0 }),
            new MouseWheelZoom({
                onFocusOnly: false,
                constrainResolution: true,
                duration: 0,
                timeout: 10,
            }),
        ]),
        overlays: [popup_overlay],
        renderer: "webgl",
        target: el,
        view,
        layers: [tile_layer, deck_layer],
    });

    map.popup = popup;
    map.popup_overlay = popup_overlay;

    return map;
}
