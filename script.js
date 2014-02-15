var Stuff = {

    findDevices: function () {
        var svg = document.getElementById("svg2").contentDocument;
        var descs =  Array.prototype.slice.call(svg.querySelectorAll("desc"));
        console.log(descs);
        descs.forEach(function (desc) {
            var result = /device=(.*)/.exec(desc.textContent);
            if (result) {
                var devname = result[1],
                    parent = desc.parentNode;
                console.log("found device: " + devname +
                            " (" + parent.getAttribute("id") + ")");
                TANGO.registerDevice(devname);
                //parent.classList.add(devname);
                if (!parent.onclick)
                    parent.onclick = function (evt) {
                        TANGO.select(devname);
                    };
            }
        });
    },

    getElementsByDeviceName: function (devname) {
        var els = [];
        var svg = document.getElementById("svg2").contentDocument;
        var descs =  Array.prototype.slice.call(svg.querySelectorAll("desc"));
        descs.forEach(function (desc) {
            var result = /device=(.*)/.exec(desc.textContent);
            if (result && result[1] == devname) {
                els.push(desc.parentNode);
            }
        });
        return els;
    },


    findParentDevice: function (el) {
        while (el) {
            var devname = Stuff.getDeviceName(el);
            if (devname)
                return devname;
            el = el.parentNode;
        }
        return null;
    },

    getDeviceName: function (el) {
        var desc = el.querySelector("desc");
        if (desc) {
            var result = /device=(.*)/.exec(desc.textContent);
            if (result)
                return result[1];
        }
        return null;
    },

    toggle: function (evt) {
        evt.stopPropagation();
        var target = evt.currentTarget;  // makes sure we get <g> element if the onclick is on it
        var devname = Stuff.findParentDevice(target);
        console.log("toggle", devname);
        if (devname)
            TANGO.toggle(devname);
        else
            console.log("no device for element " + target.getAttribute("id"));
        return false;
    },

    getBBoxAsRectElement: function (elm){
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
    },

    removeElementsOfClass: function (cls) {
        var els = Array.prototype.slice.call(
            document.getElementsByClassName("select"));
        els.forEach(function (el) {
            el.parentNode.removeChild(el);
        });
    },

    select: function (devname) {
        console.log("select", devname);
        var elements = Stuff.getElementsByDeviceName(devname);
        Stuff.removeElementsOfClass("select");

        elements.forEach(function (el) {
            //el.style.filter="url(#outline)";
            var bbrect = Stuff.getBBoxAsRectElement(el);
            el.parentNode.insertBefore(bbrect, el);
        });
    },

    setStatus: function (devname, status) {
        console.log("setStatus " + devname + " " + status);
        var els = Stuff.getElementsByDeviceName(devname);
        els.forEach(function (el) {
            console.log("id: " + el.getAttribute("id"));
            el.setAttribute("class", "status-" + status);
            console.log(el.getAttribute("class"));
        });
        Stuff.runAnim(devname, status);
    },

    runAnim: function (device, animName) {
        console.log("runAnim " + device + " " + animName);
        var els = Stuff.getElementsByDeviceName(device);
        els.forEach(function (el) {
            console.log("animating #" + el.id + " " + animName);
            var anim = Array.prototype.slice.call(el.querySelectorAll(
                "animateMotion." + animName));
            anim.forEach(function (a) {a.beginElement();});
        });
    }
};
