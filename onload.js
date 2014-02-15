window.onload = function () {

    function setupTango() {
        console.log("setupTango");
        if (window.parent.TANGO && window.parent.Stuff) {
            window.parent.TANGO.setup();
        } else {
            setTimeout(setupTango, 1000);
        }
    }

    window.Stuff = window.parent.Stuff;
    window.TANGO = window.parent.TANGO;

};
