window.onload = function () {

    var svg_el = document.getElementById("svg2"),
        overview_el = document.getElementById("overview");

    svg_el = svg_el.contentDocument.documentElement;

    var svg_width = svg_el.getAttribute("width"),
        svg_height = svg_el.getAttribute("height"),
        svg_ratio = svg_width / svg_height;

    var c = document.getElementById('overview');
    c.width = window.innerWidth;
    c.height = c.width / svg_ratio;

    var view_height = window.innerHeight - c.height,
        view_width = window.innerWidth,
        view_ratio = view_width / view_height,
        scale = c.width / (view_height * svg_ratio);
    svg_el.setAttribute("height", view_height);
    svg_el.setAttribute("width", view_height * svg_ratio);

    var ctx = c.getContext('2d');
    ctx.drawSvg("drawing-plain2.svg", 0, 0, c.width, c.height);

    var viewRect = document.createElement("div");
    viewRect.id = "view-rect";
    viewRect.style.height = c.height + "px";
    viewRect.style.width = (c.height * view_ratio) + "px";
    document.body.appendChild(viewRect);

    c.onclick = function (evt) {
        var xpos = evt.clientX;
        var left_edge = xpos - (c.height * view_ratio) / 2;
        window.scrollTo(view_height * svg_ratio * (left_edge / c.width), 0);
    };

    window.onscroll = function (evt) {
        var left_edge = window.scrollX * scale;
        viewRect.style.left = Math.round(left_edge) + "px";
    };

    window.onresize = function (evt) {
        console.log("zoom", evt);
    };

    if (window.TANGO)
        TANGO.setup();

};
