var Tango;

(function () {


    Tango = {
        register: register,
        select: select,
        selectDevice: selectDevice,
        toggle: toggle,
        setStatus: setStatus,

        console: function (s) {console.log("Tango console: " + s);}
    };

    var svg;

    function register (el) {
        //var svg = el; document.getElementById("svg2").contentDocument;
        svg = el;
        var descs =  Array.prototype.slice.call(svg.querySelectorAll("desc"));
        console.log(descs);
        descs.forEach(function (desc) {
            var result = /device=(.*)/.exec(desc.textContent);
            if (result) {
                var devname = result[1],
                    parent = desc.parentNode;
                console.log("found device: " + devname +
                            " (" + parent.getAttribute("id") + ")");
                window.TANGO && TANGO.registerDevice(devname);
                //parent.classList.add(devname);
                if (!parent.getAttribute("label"))
                    parent.setAttribute("label", devname);
                if (!parent.onclick)
                    parent.onclick = function (evt) {
                        window.TANGO && TANGO.select(devname);
                    };
            }
        });
    }

    function getElementsByDeviceName (devname) {
        var els = [];
        //var svg = document.getElementById("svg2").contentDocument;
        var descs =  Array.prototype.slice.call(svg.querySelectorAll("desc"));
        descs.forEach(function (desc) {
            var result = /device=(.*)/.exec(desc.textContent);
            if (result && result[1] == devname) {
                els.push(desc.parentNode);
            }
        });
        return els;
    }

    function findParentDevice (el) {
        while (el) {
            var devname = getDeviceName(el);
            if (devname)
                return devname;
            el = el.parentNode;
        }
        return null;
    }

    function getDeviceName (el) {
        var desc = el.querySelector("desc");
        if (desc) {
            var result = /device=(.*)/.exec(desc.textContent);
            if (result)
                return result[1];
        }
        return null;
    }

    function toggle (evt) {
        evt.stopPropagation();
        var target = evt.currentTarget;  // makes sure we get <g> element if the onclick is on it
        var devname = findParentDevice(target);
        console.log("toggle", devname);
        if (devname)
            window.TANGO && TANGO.toggle(devname);
        else
            console.log("no device for element " + target.getAttribute("id"));
        return false;
    }

    function getBBoxAsRectElement (elm) {
        var bb = elm.getBBox();
        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        console.log("bbrect " + bb.width + ", " + bb.height);
        var padding = 0.2 * Math.min(bb.width, bb.height);
        rect.setAttribute("width", bb.width + 2*padding);
        rect.setAttribute("height", bb.height + 2*padding);
        rect.setAttribute("x", bb.x - padding);
        rect.setAttribute("y", bb.y - padding);
        rect.setAttribute("rx", 2*padding);
        rect.setAttribute("ry", 2*padding);
        rect.setAttribute("class", "select");
        return rect;
    }

    function removeElementsOfClass (cls) {
        var els = Array.prototype.slice.call(
            svg.getElementsByClassName("select"));
        els.forEach(function (el) {
            el.parentNode.removeChild(el);
        });
    }

    function select(ev) {
        var devName = getDeviceName(ev.target);
        console.log("select " + devName);
        TANGO.select(devName);
    };

    function selectDevice (devname) {
        console.log("selectDevice", devname);
        removeElementsOfClass("select");

        var elements = getElementsByDeviceName(devname);
        elements.forEach(function (el) {
            // el.style.filter="url(#outline)";
            var bbrect = getBBoxAsRectElement(el);
            el.parentNode.insertBefore(bbrect, el);
        });
    }

    function setStatus (devname, status) {
        console.log("setStatus " + devname + " " + status);
        var els = getElementsByDeviceName(devname);
        els.forEach(function (el) {
            console.log("id: " + el.getAttribute("id"));
            el.setAttribute("class", "status-" + status);
            console.log(el.getAttribute("class"));
        });
        runAnim(devname, status);
    }

    function runAnim (device, animName) {
        console.log("runAnim " + device + " " + animName);
        var els = getElementsByDeviceName(device);
        els.forEach(function (el) {
            console.log("animating #" + el.id + " " + animName);
            var anim = Array.prototype.slice.call(el.querySelectorAll(
                "animateMotion." + animName));
            anim.forEach(function (a) {a.beginElement();});
        });
    }

})();
