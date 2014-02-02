window.onload = function () {

    var svg_el = document.getElementById("svg2"),
        svg = svg_el.contentDocument.documentElement,
        overview_el = document.getElementById("overview"),
        container_el = document.getElementById("overview-container"),
        synoptic_el = document.getElementById("synoptic"),

        events = {
            scroll: new signals.Signal(),
            zoom: new signals.Signal()
        };

    // setup SVG
    var svg_width = svg.getAttribute("width"),
        svg_height = svg.getAttribute("height"),
        svg_ratio = svg_width / svg_height;
    svg.setAttribute("viewBox", "0 0 " + svg_width + " " + svg_height);

    var view_height = synoptic_el.clientHeight,
        view_width = synoptic_el.clientWidth,
        view_ratio = view_width / view_height,
        zoom, start_zoom;
    if (svg_ratio > view_ratio) {
        setSize(svg_el, view_width, view_width / svg_ratio);
        zoom = start_zoom = view_width / svg_width;
    } else {
        setSize(svg_el, view_height * svg_ratio, view_height);
        zoom = start_zoom = view_height / svg_height;
    }

    // setup Overview
    updateZoomLevels(0);
    setSize(overview_el, container_el.offsetWidth,
            container_el.offsetWidth / svg_ratio);
    var overview_size = getSize(overview_el),
        scale = overview_size.width / svg_width,
        oe = svg.cloneNode(true);
    oe.id = "overview-svg";
    setSize(oe, overview_size.width, overview_size.height);
    overview_el.appendChild(oe);

    // view rectangle indicator
    var viewRect = document.createElement("div");
    viewRect.id = "view-rect";
    updateViewRect();
    container_el.appendChild(viewRect);

    function getSize(el) {
        return {width: parseInt(el.style.width.slice(0, -2)),
                height: parseInt(el.style.height.slice(0, -2))};
    }

    function setSize(el, w, h) {
        el.style.width = Math.round(w) + "px";
        el.style.height = Math.round(h) + "px";
    }

    function getOffset(el) {
        return {left: parseInt(el.style.left.slice(0, -2) || 0),
                top: parseInt(el.style.top.slice(0, -2) || 0)};
    }

    function setOffset(el, x, y) {
        el.style.left = Math.round(x) + "px";
        el.style.top = Math.round(y) + "px";
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
        return {x: coords.x / zoom, y: coords.y / zoom};
    }

    // svg -> container
    function svg2screen(coords) {
        return {x: coords.x * zoom, y: coords.y * zoom};
    }

    // Update the position and size of the overview indicator
    function updateViewRect() {
        var offset = getOffset(svg_el),
            topleft = svg2overview(screen2svg({x: -offset.left, y: -offset.top})),
            width = scale * view_width / zoom,
            height = scale * view_height / zoom;
        setOffset(viewRect, topleft.x, topleft.y);
        setSize(viewRect, width, height);
    }

    // Update which objects are shown depending pon zoom level
    function updateZoomLevels(fadetime) {
        fadetime = fadetime >= 0? fadetime : 500;
        var z = zoom / start_zoom,
            layers = Array.prototype.slice.call(svg.getElementsByTagName("g"));
        layers.forEach(function (l) {
            var gid = l.getAttribute("id"),
                match = /layer(\d+)/.exec(gid);
            if (match) {
                var level = parseInt(match[1]) - 1, $l = $(l);
                $l.stop();  // let's not pile animations on each other
                if (z >= level)
                    $l.fadeIn(fadetime);
                else
                    $l.fadeOut(fadetime);
            }
        });
    };

    // Wrap a function to only be run at most every <threshold>
    // ms. Useful e.g. for slowing down mouse callbacks.
    function throttle(fn, threshhold, scope) {
        threshhold || (threshhold = 100);
        var last, deferTimer;
        return function () {
            var context = scope || this,
                now = +new Date, args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }

    // Event handlers
    events.zoom.add(throttle(function (zoom) {
        updateViewRect();
        updateZoomLevels();
    }));

    events.scroll.add(throttle(function () {
        updateViewRect();
    }));

    // Clicking the overview should scroll the view there
    $(overview_el).on("click", function (evt) {
        var xpos = evt.clientX - container_el.offsetLeft,
            ypos = evt.clientY - container_el.offsetTop,
            center = svg2screen(overview2svg({x: xpos, y: ypos}));
        setOffset(svg_el, -(center.x - view_width / 2),
                  -(center.y - view_height / 2));
        events.scroll.dispatch();
    });

    // Zooming the view
    $(svg).mousewheel(function (evt) {
        
        evt.preventDefault();

        var size = getSize(svg_el), offset = getOffset(svg_el),
            screen_pos = {x: evt.clientX + offset.left, y: evt.clientY + offset.top},
            center = screen2svg({x: evt.clientX, y: evt.clientY}),
            delta = evt.deltaY, factor =  1 + delta * 0.1,
            new_width = size.width * factor, 
            new_height = size.height * factor;
        
        zoom = new_width / svg_width;

        setSize(svg_el, new_width, new_height);
        center = svg2screen(center);
        setOffset(svg_el, screen_pos.x - center.x, screen_pos.y - center.y);
        events.zoom.dispatch();
    });

    // Panning the view
    $(svg).on("mousedown", function (evt) {

        var offset = getOffset(svg_el), $element = $(evt.target),
            start_coords = {x: evt.screenX, y: evt.screenY},
            orig_evt = evt;
        
        $element.on("mousemove", function (evt) {
            var deltaX = evt.screenX - start_coords.x,
                deltaY = evt.screenY - start_coords.y;
            setOffset(svg_el, offset.left + deltaX, offset.top + deltaY);
            events.scroll.dispatch();
        });

        $element.on("mouseup", function (evt) {
            $element.off("mousemove mouseup");
        });
    });

    // Show the SVG when everything is set up
    $(svg_el).fadeIn(1000);

};
