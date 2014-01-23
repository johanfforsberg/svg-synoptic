window.onload = function () {

    var svg_el = document.getElementById("svg2"),
        overview_el = document.getElementById("overview"),
        container_el = document.getElementById("overview-container"),
        synoptic_el = document.getElementById("synoptic");

    svg_el = svg_el.contentDocument.documentElement;
    svg_el.setAttribute("viewBox", "0 0 " +
                        svg_el.getAttribute("width") + " " +
                        svg_el.getAttribute("height"));
    console.log(svg_el);

    var svg_width = svg_el.getAttribute("width"),
        svg_height = svg_el.getAttribute("height"),
        svg_ratio = svg_width / svg_height;

    overview_el.width = container_el.offsetWidth;
    overview_el.height = overview_el.width / svg_ratio;

    var view_height = window.innerHeight, // - c.height,
        view_width = window.innerWidth,
        view_ratio = view_width / view_height,
        scale = overview_el.width / svg_width;
    svg_el.setAttribute("height", view_height);
    svg_el.setAttribute("width", view_height * svg_ratio);

    // draw the overview
    var ctx = overview_el.getContext('2d');
    ctx.drawSvg(svg_el.baseURI, 0, 0, overview_el.width, overview_el.height);

    var viewRect = document.createElement("div");
    viewRect.id = "view-rect";
    viewRect.style.height = overview_el.height + "px";
    viewRect.style.width = (overview_el.height * view_ratio) + "px";
    container_el.appendChild(viewRect);

    function svg2overview(coords) {
        return {x: coords.x * scale, y: coords.y * scale};
    }

    function overview2svg(coords) {
        return {x: coords.x / scale, y: coords.y / scale};
    }

    function screen2svg(coords) {
        var zoom = svg_el.getAttribute("width") / svg_width;
        return {x: coords.x / zoom, y: coords.y / zoom};
    }

    function svg2screen(coords) {
        var zoom = svg_el.getAttribute("width") / svg_width;
        return {x: coords.x * zoom, y: coords.y * zoom};
    }

    function updateViewRect() {
        var left = synoptic_el.scrollLeft, top = synoptic_el.scrollTop,
            topleft = svg2overview(screen2svg({x: left, y: top})),
            botright = svg2overview(screen2svg(
                {x: left + synoptic_el.offsetWidth,
                 y: top + synoptic_el.offsetHeight})),
            size = {x: botright.x - topleft.x, y: botright.y - topleft.y};
        viewRect.style.left = Math.round(topleft.x) + "px";
        viewRect.style.top = Math.round(topleft.y) + "px";
        viewRect.style.width = Math.round(size.x) + "px";
        viewRect.style.height = Math.round(size.y) + "px";
    }

    $(overview_el).on("click", function (evt) {
        var xpos = evt.clientX - container_el.offsetLeft,
            ypos = evt.clientY - container_el.offsetTop,
            center = svg2screen(overview2svg({x: xpos, y: ypos}));
        synoptic_el.scrollLeft = center.x - view_width / 2;
        synoptic_el.scrollTop = center.y - view_height / 2;
    });

    $(synoptic_el).scroll(function (evt) {updateViewRect();});

    // FF ignores this listener on window, document or synoptic_el.
    $(svg_el).mousewheel(function (evt) {
        var height = svg_el.getAttribute("height"),
            width = svg_el.getAttribute("width"),
            dy = evt.deltaY,
            center = screen2svg({x: evt.clientX, y: evt.clientY});

        // zoom the svg
        svg_el.setAttribute("height", height * (1 + dy * 0.05));
        svg_el.setAttribute("width", width * (1 + dy * 0.05));
        center = svg2screen(center);
        synoptic_el.scrollLeft -= evt.clientX - center.x;
        synoptic_el.scrollTop -= evt.clientY - center.y;

    });

    if (window.TANGO)
        TANGO.setup();

};
