import * as L from 'leaflet';


export function layer_lifemap(el, options) {
    const { zoom = 5, minZoom = 4, maxZoom = 32 } = options
    let map = L.map(el, {
        center: [-4.226497, 0],
        zoom: zoom,
    });
    L.tileLayer('https://lifemap.univ-lyon1.fr/osm_tiles/{z}/{x}/{y}.png', { minZoom: minZoom, maxZoom: maxZoom }).addTo(map);
    return map
}
