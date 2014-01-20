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

from PyQt4 import QtCore
from PyQt4.QtCore import Qt, QObject, pyqtSlot, QUrl
from PyQt4.QtGui import QApplication, QScrollArea
from PyQt4.QtWebKit import QWebView, QWebPage


class TangoSomething(QtCore.QObject):

    """Interface between webview and Tango"""

    def __init__(self, frame, parent=None):
        self.frame = frame
        self.open = False
        self._devices = dict()
        self.selected_device = None
        super(TangoSomething, self).__init__(parent)

    @QtCore.pyqtSlot(str)
    def select(self, devname):
        print "select", devname
        if not devname == self.selected_device:
            self.frame.evaluateJavaScript("Stuff.select('%s')" % devname)
            self.selected_device = devname

    @QtCore.pyqtSlot(str)
    def toggle(self, devname):
        direction = "OFF" if self._devices[devname] == "ON" else "ON"
        print "toggle", devname, self.open, "->", direction
        self.frame.evaluateJavaScript("Stuff.runAnim('%s', '%s')" %
                                      (devname, direction))
        self.set_status(devname, direction)

    @QtCore.pyqtSlot(str)
    def registerDevice(self, devname):
        self._devices[devname] = False
        print "Registered device %s" % devname

    def set_status(self, devname, status):
        if status != self._devices[devname]:
            self.frame.evaluateJavaScript("Stuff.setStatus('%s', '%s')" %
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
        self.logger.warn("JsConsole(%s:%d):\n\t%s" % (sourceID, lineNumber, msg))


class ZoomingWebView(QWebView):

    def __init__(self, *args, **kwargs):
        super(ZoomingWebView, self).__init__(*args, **kwargs)
        # Prevent the reload menu from opening. It will be useless anyway.
        self.setContextMenuPolicy(QtCore.Qt.PreventContextMenu)

    def wheelEvent(self, event):
        frame = self.page().mainFrame()
        print event.delta()
        scale = 1 + 0.1 * (event.delta() / 120)
        frame.setZoomFactor(frame.zoomFactor() * scale)

    def contentsSizeChanged(self, event):
        print(event)


class WorkThread(QtCore.QThread):

    signal = QtCore.pyqtSignal([str, str])

    def __init__(self, tango, devices, interval=1.0):
        self.tango = tango
        self.devices = devices
        self.interval = interval
        QtCore.QThread.__init__(self)

    def run(self):
        on = False
        while True:
            time.sleep(self.interval)
            new_status = "ON" if on else "OFF"
            self.signal.emit(random.choice(self.devices), new_status)
            on = not on


if __name__ == '__main__':
    app = QApplication(sys.argv)

    view = ZoomingWebView()
    view.setPage(LoggingWebPage())

    svg = QUrl(sys.argv[1])
    view.load(svg)

    frame = view.page().mainFrame()
    frame.setScrollBarPolicy(Qt.Horizontal, Qt.ScrollBarAlwaysOn)
    frame.setScrollBarPolicy(Qt.Vertical, Qt.ScrollBarAlwaysOn)

    tango = TangoSomething(frame)
    frame.addToJavaScriptWindowObject('TANGO', tango)

    view.show()

    thread = WorkThread(tango, ["fisk/och/kex", "hej/med/ost", "another/fake/device"])
    thread.signal.connect(tango.set_status)
    thread.start()

    app.exec_()
