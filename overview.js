window.onload = function () {setTimeout(function () {

    var svg_el = document.getElementById("svg2"),
        overview_el = document.getElementById("overview"),
        container_el = document.getElementById("overview-container"),
        synoptic_el = document.getElementById("synoptic"),
        $svg = $("#svg2");

    svg_el = svg_el.contentDocument.documentElement;
    var svg_width = svg_el.getAttribute("width"),
        svg_height = svg_el.getAttribute("height"),
        svg_ratio = svg_width / svg_height;
    svg_el.setAttribute("viewBox", "0 0 " + svg_width + " " + svg_height);

    overview_el.width = container_el.offsetWidth;
    overview_el.height = overview_el.width / svg_ratio;

    var view_height = synoptic_el.clientHeight, view_width = synoptic_el.clientWidth,
        view_ratio = view_width / view_height,
        scale = overview_el.width / svg_width,
        start_zoom = view_width / svg_width, zoom = start_zoom;
    if (svg_ratio > view_ratio)
        setSvgSize(view_width, view_width / svg_ratio);
    else
        setSvgSize(view_height * svg_ratio, view_height);

    updateZoomLevels();

    // draw the overview
    var oe = svg_el.cloneNode(true);
    oe.id = "overview-svg";
    oe.setAttribute("height", overview_el.height);
    oe.setAttribute("width", overview_el.width);
    overview_el.appendChild(oe);

    var viewRect = document.createElement("div");
    viewRect.id = "view-rect";
    updateViewRect();
    container_el.appendChild(viewRect);

    function getSvgSize() {
        return {width: svg_el.getAttribute("width"),
                height: svg_el.getAttribute("height")};
    }

    function setSvgSize(w, h) {
        svg_el.setAttribute("width", w);
        svg_el.setAttribute("height", h);
    }

    function getSvgOffset() {
        return $svg.offset();
    }

    function setSvgOffset(x, y) {
        $svg.offset({left: x, top:y});
    }

    function setSvgOffsetDelta(dx, dy) {
        var current = getSvgOffset();
        setSvgOffset(current.left + dx, current.top + dy);
    }

    // convert coordinates from svg to container
    function svg2overview(coords) {
        return {x: coords.x * scale, y: coords.y * scale};
    }

    // overview -> svg
    function overview2svg(coords) {
        return {x: coords.x / scale, y: coords.y / scale};
    }

    // container -> svg
    function screen2svg(coords) {
        var zoom = svg_el.getAttribute("width") / svg_width;
        return {x: coords.x / zoom, y: coords.y / zoom};
    }

    // svg -> container
    function svg2screen(coords) {
        var zoom = svg_el.getAttribute("width") / svg_width;
        return {x: coords.x * zoom, y: coords.y * zoom};
    }

    // Update the position and size of the overview indicator
    function updateViewRect() {
        var offset = getSvgOffset(),
            topleft = svg2overview(screen2svg({x: -offset.left, y: -offset.top})),
            width = scale * view_width / zoom, 
            height = scale * view_height / zoom;
        viewRect.style.left = Math.round(topleft.x) + "px";
        viewRect.style.top = Math.round(topleft.y) + "px";
        viewRect.style.width = Math.round(width) + "px";
        viewRect.style.height = Math.round(height) + "px";        
    }

    // Event handlers
    $(document).on("zoom", function () {
        updateViewRect();
        updateZoomLevels();
    });

    $(document).on("scroll", function () {
        updateViewRect();
    });

    // Clicking the overview should scroll the view there
    $(overview_el).on("click", function (evt) {
        var xpos = evt.clientX - container_el.offsetLeft,
            ypos = evt.clientY - container_el.offsetTop,
            center = svg2screen(overview2svg({x: xpos, y: ypos}));
        setSvgOffset(-(center.x - view_width / 2), -(center.y - view_height / 2));
        $(document).trigger("scroll");
    });

    // Update which objects are shown depending pon zoom level
    function updateZoomLevels(zoomlevel) {
        var z = zoomlevel || zoom / start_zoom,
            layers = Array.prototype.slice.call(svg_el.getElementsByTagName("g"));
        layers.forEach(function (l) {
            var gid = l.getAttribute("id"),
                match = /layer(\d+)/.exec(gid);
            if (match) {
                var level = parseInt(match[1]) - 1;
                console.log("layer", gid, level);
                if (z >= level)
                    l.style.display = "block";
                else
                    l.style.display = "none";
            }
        });
    };

    // Zooming the view
    $(synoptic_el).mousewheel(function (evt) {
        evt.preventDefault();
        var size = getSvgSize(), offset = getSvgOffset(),
            center = screen2svg({x: evt.pageX - offset.left, y: evt.pageY - offset.top}),
            scroll = evt.deltaY, factor =  1 + scroll * 0.1,
            new_width = size.width * factor, new_height = size.height * factor;
        zoom = new_width / svg_width;

        setSvgSize(new_width, new_height);
        center = svg2screen(center);
        setSvgOffset(evt.pageX - center.x, evt.pageY - center.y);

        $(document).trigger("zoom");
    });

    // Panning the view
    var start_coords;
    $(synoptic_el).mousedown(function (evt) {
        var offset = getSvgOffset();
        start_coords = {x: evt.pageX - offset.left, y: evt.pageY - offset.top};
    });

    $(synoptic_el).mousemove(function (evt) {
        if (start_coords) {
            setSvgOffset(evt.pageX - start_coords.x, evt.pageY - start_coords.y);
            $(document).trigger("scroll");
        }
    });

    $(synoptic_el).mouseup(function (evt) {
        start_coords = null;
    });    
 
    // Show the SVG when everything is set up
    $("#svg2").css({visibility: "visible"});

    if (window.TANGO)
        TANGO.setup();

}, 1000);};
