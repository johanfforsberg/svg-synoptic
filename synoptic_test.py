"""
Wishlist:

* integrate with Tango/Taurus
* Better zooming, center on mouse, panning etc
* "overview" which shows the whole image and the current viewbox, allowing
  the user to click/drag to move the view
* hide/show:able ayers showing different types of information, e.g. vacuum,
  power, and so on
* hiding/showing details depending on the zoom level
* don't update elements that are not in view

"""

import logging
from pprint import pprint
import random
import sys
import time

from PyQt4 import QtCore, QtGui
from PyQt4.QtCore import Qt, QObject, pyqtSlot, QUrl
from PyQt4.QtGui import QApplication, QScrollArea, QWidget
from PyQt4.QtWebKit import QWebView, QWebPage


class TangoSomething(QtCore.QObject):

    """Interface between webview and Tango (doesn't really involve
    Tango yet, just python for now.)

    All methods decorated with "pyqtSlot" on this class can be called
    from JS.
    """

    def __init__(self, frame, parent=None, activate_devices=True):
        self.frame = frame
        self.activate_devices = activate_devices

        self._devices = dict()
        self.selected_device = None
        super(TangoSomething, self).__init__(parent)

    @QtCore.pyqtSlot()
    def setup(self):
        if self.activate_devices:
            self.frame.evaluateJavaScript("Tango.findDevices()")

    @QtCore.pyqtSlot(str)
    def select(self, devname):
        print "select", devname
        if not devname == self.selected_device:
            self.frame.evaluateJavaScript("Tango.selectDevice('%s')" % devname)
            self.selected_device = devname

    @QtCore.pyqtSlot(str)
    def toggle(self, devname):
        direction = "OFF" if self._devices[devname] == "ON" else "ON"
        self.frame.evaluateJavaScript("Tango.runAnim('%s', '%s')" %
                                      (devname, direction))
        self.set_status(devname, direction)

    @QtCore.pyqtSlot(str)
    def registerDevice(self, devname):
        self._devices[devname] = False
        print "Registered device %s" % devname

    def set_status(self, devname, status):
        if status != self._devices[devname]:
            self.frame.evaluateJavaScript("Tango.setStatus('%s', '%s')" %
                                          (devname, status))
            self._devices[devname] = status


class LoggingWebPage(QWebPage):
    """
    Makes it possible to use a Python logger to print javascript console
    messages
    """
    def __init__(self, logger=None, parent=None):
        super(LoggingWebPage, self).__init__(parent)
        if not logger:
            logger = logging
        self.logger = logger

    def javaScriptConsoleMessage(self, msg, lineNumber, sourceID):
        self.logger.warn("JsConsole(%s:%d):\n\t%s" %
                         (sourceID, lineNumber, msg))


class SynopticWidget(QWidget):

    def __init__(self, url):
        super(SynopticWidget, self).__init__()
        self.url = url
        self.setup_ui()

    def setup_ui(self):
        hbox = QtGui.QHBoxLayout(self)
        hbox.setContentsMargins(0, 0, 0, 0)
        hbox.layout().setContentsMargins(0, 0, 0, 0)
        hbox.addWidget(self.create_view())
        self.setLayout(hbox)

    def create_view(self, use_tango=True):
        view = QWebView(self)
        view.setPage(LoggingWebPage())

        svg = QUrl(self.url)
        view.load(svg)

        frame = view.page().mainFrame()
        # frame.setScrollBarPolicy(Qt.Horizontal, Qt.ScrollBarAlwaysOn)
        # frame.setScrollBarPolicy(Qt.Vertical, Qt.ScrollBarAlwaysOn)

        if use_tango:
            self.tango = TangoSomething(frame)
            # Inject TangoSomething into the JS global namespace as TANGO
            frame.addToJavaScriptWindowObject('TANGO', self.tango)
        return view


class WorkThread(QtCore.QThread):

    """Does some random activating/deactivating of devices, just to
    simulate some action...
    """

    signal = QtCore.pyqtSignal([str, str])

    def __init__(self, tango, interval=1.0):
        self.tango = tango
        self.interval = interval
        QtCore.QThread.__init__(self)

    def run(self):
        on = False
        while True:
            time.sleep(self.interval)
            new_status = "ON" if on else "OFF"
            if self.tango._devices:
                self.signal.emit(random.choice(self.tango._devices.keys()),
                                 new_status)
            on = not on


if __name__ == '__main__':

    if len(sys.argv) != 2:
        sys.exit("Please give a html file as argument.")

    app = QApplication(sys.argv)

    synoptic = SynopticWidget(sys.argv[1])

    thread = WorkThread(synoptic.tango)
    thread.signal.connect(synoptic.tango.set_status)
    thread.start()

    synoptic.show()

    app.exec_()
