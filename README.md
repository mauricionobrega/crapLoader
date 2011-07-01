Introduction
------------
The goal of crapLoader is to loads ads, widgets or any javascript-code with
document.write in it. The recommended solution is to use iframes for
third-party content, but this is not always possible. Normally document.write
prevents you from loading a script asynchronously, but this lib hijacks
document.write and delegates the content loaded from each script into the
correct position. Not all ad-providers allow you to replace document.write,
so make sure to check their terms before you start using this library.


Stability
---------
crapLoader can handle more than any other open-source document.write hack that
I've found, but I'm sure there are plenty of edge-cases it does not handle
(yet). If you find something crapLoader can't handle please open a new issue
with a *reproducible standalone example*.

*Use at your own responsibility!*
[Murpy's laws](http://www.murphys-laws.com/murphy/murphy-laws.html) apply


Simple usage
------------
Usually banners are included with `document.write("<script src='...'></script>")´. Instead call crapLoader.loadScript with the same url as you had in the src attribute, and the DOM id of the element where you want the content:

    <script type="text/javascript" src="crapLoader.js"></script>

    <div id="banner1"></div>
    <script type="text/javascript">
        crapLoader.loadScript("http://foo.bar/ad1.js", "banner1");
    </script>

    <div id="banner2"></div>
    <script type="text/javascript">
        crapLoader.loadScript("http://foo.bar/ad2.js", "banner2");
    </script>

This will load the scripts in parallel and put the document.write-output into the corresponding div.


Advanced usage
--------------
First you have to hijack document.write. It should only be called once even if you load multiple scripts. You can do it before or after page load, but it has to be before you load the scripts that use document.write. In simple mode crapLoader will automatically hijack the document.write and writeln method. If you want to hijack earlier or set global uptions, you must call hijack yourself.

    crapLoader.hijack({        /* Hijacks write, writeln and getElementById */
        debug: true,           /* Logs debug output to the console */
        loadSequentially: true /* Load in parallel or sequential? default false */
    });

Then you must use crapLoader to load each script and supply a container id for the output from document.write.

    <script type="text/javascript" src="crapLoader.js"></script>

    <div id="banner1"></div>
    <div id="banner2"></div>
    <script type="text/javascript">
        crapLoader.loadScript("http://foo.bar/ad1.js", "banner1", {
            succsess: function() {
                if( !$("#banner1 img").is("[src $= 1px.gif]") ) { // if not an empty gif
                    $("body").addClass("dominance");              // it's a dominance ad!
                }
            }
        });
        crapLoader.loadScript("http://foo.bar/ad2.js", "banner2", {
            charset: "iso-8859-1"
        });
    </script>


Alternatives
------------
See my collection of document.write bookmarks on Delicious:
http://www.delicious.com/gregersrygg/document.write