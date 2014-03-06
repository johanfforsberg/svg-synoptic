d3.xml("maxiv-machine.svg", "image/svg+xml", function(xml) {

    var importedNode = document.importNode(xml.documentElement, true),
        container = document.getElementById("view");

    // callback for when the user zooms or pans the view.
    function zoomed () {
        // update the zoom level and offset on the main view
        svg.select("g").attr("transform", 
                             "translate(" + d3.event.translate + ")" +
                             "scale(" + d3.event.scale + ")");
    }

    // A D3 zoom "behavior" to attach to the SVG, allowing panning and zooming
    // using the mouse
    var zoom = d3.behavior.zoom();
    zoom.on("zoom", zoomed)
        .scaleExtent([1, 10])
        .scale(container.offsetWidth / importedNode.getAttribute("width"))
        .size([container.offsetWidth, container.offsetHeight]);

    var svg = d3.select(importedNode)
            .attr("id", "main-svg")
            .call(zoom);
    
    // insert the SVG into the page
    d3.select("#view").node()
        .appendChild(importedNode);

    zoom.event(svg);
    Tango.register(importedNode);
    
});
