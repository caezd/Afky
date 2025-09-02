(function () {
    'use strict';

    function forceFirstPaint(map) {
        map.resize();
        map.jumpTo({ center: map.getCenter(), zoom: map.getZoom() });
        if (map.triggerRepaint) map.triggerRepaint();
    }

    function main() {
        new Honey({
            index_box: function (data) {
                console.log(data);
                const maps = {};
                const forums = {};
                data.categories[0].forums.forEach(function (forum) {
                    forums[forum.name] = forum;
                    maps[forum.name] = new maplibregl.Map({
                        container: `${forum.name}`,
                        style: { version: 8, sources: {}, layers: [] },
                        center: [0, 0],
                        zoom: 1,
                        minZoom: 0,
                        maxZoom: 3,
                        trackResize: true,
                        attributionControl: false,
                    });
                });
                // loops des maps
                for (const mapName in maps) {
                    const map = maps[mapName];

                    try {
                        const forumRes = fetch(`/${forums[mapName]?.id}-forum`)
                            .then((res) => res.text())
                            .then((result) => {
                                // 1) Parser le HTML
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(
                                    result,
                                    "text/html"
                                );

                                // 2) Regex pour détecter [x,y] (espaces optionnels, décimaux, +/-)
                                const coordRe =
                                    /\[\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\]/;

                                // 3) Récupérer tous les <a> qui matchent
                                const anchors = Array.from(
                                    doc.querySelectorAll("a")
                                );
                                const matches = anchors.filter((a) =>
                                    coordRe.test(a.textContent || "")
                                );

                                // 4a) Si tu veux juste l’HTML complet de chaque <a>
                                const anchorsHTML = matches.map((a) => a.outerHTML);

                                const anchorsWithCoords = matches.map((a) => {
                                    const m = (a.textContent || "").match(coordRe);
                                    const coords = m
                                        ? [Number(m[1]), Number(m[2])]
                                        : null;
                                    return {
                                        outerHTML: a.outerHTML,
                                        coords, // ex: [12.34, -56.78]
                                        text: a.textContent?.trim() || "",
                                        href: a.getAttribute("href") || null,
                                    };
                                });

                                anchorsWithCoords.forEach((a) => {
                                    if (!a.coords) return;

                                    new maplibregl.Marker({ color: "#d1193e" })
                                        .setLngLat(a.coords)
                                        .setPopup(
                                            new maplibregl.Popup({
                                                offset: 16,
                                            }).setHTML(
                                                `<div class="marker-popup"><strong>Position</strong><br/>${a.text}</div>`
                                            )
                                        )
                                        .addTo(map);
                                });
                            });
                    } catch (e) {
                        console.error(`Failed to fetch forum ${forumId}:`, e);
                    }

                    map.on("click", (e) => {
                        // The event object (e) contains information like the
                        // coordinates of the point on the map that was clicked.
                        console.log("A click event has occurred at " + e.lngLat);
                    });

                    map.on("load", () => {
                        map.setRenderWorldCopies(false);
                        map.addSource("r", {
                            type: "raster",
                            tiles: [
                                `http://127.0.0.1:8080/${mapName}/{z}/{y}/{x}.webp`,
                            ],
                            tileSize: 512,
                            minzoom: 0,
                            maxzoom: 3,
                            scheme: "xyz",
                        });
                        map.addLayer({ id: "r", type: "raster", source: "r" });
                        forceFirstPaint(map);
                    });
                }

                return data;
            },
        });
    }
    main();

})();
//# sourceMappingURL=afky.js.map
