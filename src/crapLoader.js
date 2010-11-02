
var crapLoader = (function() {
    var initialized = false
        ,queue = []
        ,inputBuffer = []
        ,writeBuffer = {}
        ,chunkBuffer
        ,loading = 0
        ,elementCache = {}
        ,splitScriptsRegex = /(<script[^>]+src=['"]?[^'"\s]+[^>]*>\s*<\/script>)/
        ,externalScriptSrcRegex = /<script[^>]+src=['"]?([^'"\s]+)[^>]*>\s*<\/script>/
        ,globalOptions = {
            loadSequentially: false,
            printTree: false
        }
        ,defaultOptions = {
            async: false,
            charset: "utf-8",
            success: undefined
        },priv,publ;
     

    priv = {
        checkQueue: function() {
            if(queue.length) {
                priv.loadScript( queue.shift() );
            }
        },
        
        checkWriteBuffer: function(obj) {
            var buffer = writeBuffer[obj.domId];

            if(buffer && buffer.length) {
                priv.writeHtml( buffer.shift(), obj );

            } else {
                priv.finished(obj);
            }
        },

        extend: function(t, s) {
            if(!s) return t;
            for(var k in s) {
                t[k] = s[k];
            }
            return t;
        },
        
        finished: function(obj) {
            if(obj.success && typeof obj.success == "function") {
                obj.success.call(obj.domId);
            }
            
            priv.checkQueue();
        },

        flush: function(obj) {
            var domId = obj.domId
               ,outputFromScript
               ,htmlPartArray;

            outputFromScript = inputBuffer.join("");
            inputBuffer = [];
            
            htmlPartArray = priv.separateScriptsFromHtml( outputFromScript );
            
            
            if(!writeBuffer[domId]) {
                writeBuffer[domId] = htmlPartArray;
            } else {
                Array.prototype.unshift.apply(writeBuffer[domId], htmlPartArray);
            }
            priv.checkWriteBuffer(obj);
        },
        
        getElById: function(domId) {
            return elementCache[domId] || (elementCache[domId] = document.getElementById(domId));
        },

        loadScript: function(obj) {
            loading++;
            // async loading code from jQuery
            var head = document.getElementsByTagName("head")[0] || document.documentElement
               ,script = document.createElement("script");
            script.type = "text/javascript";
            script.charset = obj.charset;
            
            if(globalOptions.printTree) {
                priv.printScriptSrc(obj);
            }
            
            var done = false;
            // Attach handlers for all browsers
            script.onload = script.onreadystatechange = function() {
                loading--;
                script.loaded = true;
                if ( !done && (!this.readyState ||
                        this.readyState === "loaded" || this.readyState === "complete") ) {
                    done = true;
                    script.onload = script.onreadystatechange = null;
                    if ( head && script.parentNode ) {
                        head.removeChild( script );
                    }
                    
                    priv.flush(obj);
                }
            };
            
            script.loaded = false;
            script.src = obj.src;
            obj.depth++;
            
            // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
            // This arises when a base node is used (#2709 and #4378).
            head.insertBefore( script, head.firstChild );
            setTimeout(function() {
                if(!script.loaded) throw new Error("SCRIPT NOT LOADED: " + script.src);
            }, 3000);
        },
        
        printScriptSrc: function(obj) {
            var i=obj.depth, logoutput = obj.domId + " [" + i + "]: ";
            //while(i-- > 1) {
            //    logoutput += "   ";
            //}
            logoutput += "\t" +(obj.src.length > 50 ? obj.src.substr(0,50)+"..." : obj.src);
            if(window.console) console.log(logoutput);
        },
        
        separateScriptsFromHtml: function(htmlStr) {
            var splitHtml = [], tmp = htmlStr.split(splitScriptsRegex);

            for(var i=0, l=tmp.length; i<l; i=i+1) {
                if(tmp[i]!=="") splitHtml.push(tmp[i]);
            }
            
            return splitHtml;    
        },

        writeHtml: function(html, obj) {
            var scriptMatch = html.match(externalScriptSrcRegex);
            if(scriptMatch && scriptMatch.length == 2) {
                var scriptSrc = scriptMatch[1];
                obj.src = scriptSrc;
                priv.loadScript(obj);
            } else {
                var container = priv.getElById(obj.domId);
                if(!container) throw new Error("crapLoader: Unable to inject html. Element with id '" + obj.domId + "' does not exist");
                //console.log("    " + html.substring(0, html.length > 40 ? 40 : html.length).replace(/\n/g, "") + "...");
                //console.log(html);
                container.innerHTML += html;
                priv.checkWriteBuffer(obj);
            }
        },
        
        writeReplacement: function(str) {
            //console.log("document.write: " + str);
            inputBuffer.push(str);
        
        }

    };
    
    publ = {
        hijack: function(options) {
            if(initialized) return;
            initialized = true;
            priv.extend(globalOptions, options);
            
            document.write = priv.writeReplacement; 
        },
         
        loadScript: function(src, domId, options) {
            var defaultOptsCopy = priv.extend({}, defaultOptions);
            var obj = priv.extend(defaultOptsCopy, options);
            obj.src = src;
            obj.domId = domId;
            obj.depth = 0;
            
            if(globalOptions.loadSequentially) {
                queue.push(obj);
                setTimeout(function() {
                    if(loading === 0) priv.checkQueue();
                }, 1);
            } else {
                setTimeout(function() {
                    priv.loadScript(obj);
                }, 1);
            }
        },
        
        orgWrite: document.write,
     };

    return publ;
})();
