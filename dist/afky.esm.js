function forceFirstPaint(map) {
    map.resize();
    map.jumpTo({ center: map.getCenter(), zoom: map.getZoom() });
    if (map.triggerRepaint) map.triggerRepaint();
}

function forceSkew() {
    var curPage = 1;
    var numOfPages = document.querySelectorAll(".skw-page").length;
    var animTime = 1000;
    var scrolling = false;
    var pgPrefix = ".skw-page-";

    function pagination() {
        scrolling = true;

        var cur = document.querySelector(pgPrefix + curPage);
        if (cur) {
            cur.classList.remove("inactive");
            cur.classList.add("active");
        }

        var prev = document.querySelector(pgPrefix + (curPage - 1));
        if (prev) prev.classList.add("inactive");

        var next = document.querySelector(pgPrefix + (curPage + 1));
        if (next) next.classList.remove("active");

        setTimeout(function () {
            scrolling = false;
        }, animTime);
    }

    function navigateUp() {
        if (curPage === 1) return;
        curPage--;
        pagination();
    }

    function navigateDown() {
        if (curPage === numOfPages) return;
        curPage++;
        pagination();
    }

    function onWheel(e) {
        if (scrolling) return;
        // wheel: deltaY>0 descend; mousewheel: wheelDelta>0 monte; DOMMouseScroll: detail<0 monte
        var delta =
            e.deltaY !== undefined ? -e.deltaY : e.wheelDelta || -e.detail;
        if (delta > 0) {
            navigateUp();
        } else {
            navigateDown();
        }
    }

    function onKeydown(e) {
        if (scrolling) return;
        var code = e.which || e.keyCode;
        if (code === 38 || e.key === "ArrowUp") {
            navigateUp();
        } else if (code === 40 || e.key === "ArrowDown") {
            navigateDown();
        }
    }

    document.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("mousewheel", onWheel, { passive: true });
    document.addEventListener("DOMMouseScroll", onWheel, { passive: true });
    document.addEventListener("keydown", onKeydown);

    // Optionnel: renvoie une fonction de nettoyage si tu veux détacher les listeners plus tard
    return function destroyForceSkew() {
        document.removeEventListener("wheel", onWheel);
        document.removeEventListener("mousewheel", onWheel);
        document.removeEventListener("DOMMouseScroll", onWheel);
        document.removeEventListener("keydown", onKeydown);
    };
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
                    zoom: 2,
                    minZoom: 0,
                    maxZoom: 5,
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

                                const el = document.createElement("div");
                                el.className = "test-marker";
                                el.style.backgroundImage = `url('http://picsum.photos/25/25')`;
                                const marker = new maplibregl.Marker({
                                    element: el,
                                })
                                    .setLngLat(a.coords)
                                    .setPopup(
                                        new maplibregl.Popup({
                                            offset: 16,
                                        }).setHTML(
                                            `<div class="marker-popup"><strong>Position</strong><br/>${a.text}</div>`
                                        )
                                    )
                                    .addTo(map);
                                marker.setSubpixelPositioning(true);
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
                    forceSkew();
                });
            }

            return data;
        },
    });
}
main();
//# sourceMappingURL=afky.esm.js.map
