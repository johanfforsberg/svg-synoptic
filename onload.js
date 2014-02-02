    // function setupTango() {
    //     console.log("setupTango");
    //     if (window.parent.TANGO && window.parent.Stuff) {
    //         window.parent.TANGO.setup();
    //     } else {
    //         setTimeout(setupTango, 1000);
    //     }
    // }


window.onload = function () {

    console.log("onload");

    window.Tango = window.parent.Tango;

    Tango.console("fisk");

};
