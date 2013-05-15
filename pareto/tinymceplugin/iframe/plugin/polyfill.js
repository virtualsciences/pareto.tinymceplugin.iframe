// sorry folks, just can't live without these anymore... :|
if (!Function.prototype.bind) {
    Function.prototype.bind = function(context) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var func = this;
        return function() {
            var finalargs = [].concat(args);
            for (var i = 0; i < arguments.length; i++) {
                finalargs.push(arguments[i]);
            }
            return func.apply(context, finalargs);
        };
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(item) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == item) {
                return i;
            }
        }
        return -1;
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return /^\s*(.*?)\s*$/.exec(this)[1];
    };
}

// nasty hack to get limited (only on document) querySelector support on old
// IEs...
// stolen from https://gist.github.com/2724353
if (!document.querySelectorAll) {
    document.querySelectorAll = function(selector) {
        var doc = document;
        var head = doc.documentElement.getElementsByTagName('head')[0];
        var styleTag = doc.createElement('STYLE');
        head.appendChild(styleTag);
        window.__qsaels = [];

        styleTag.styleSheet.cssText =
            selector + '{x: expression(window.__qsaels.push(this))}';
        window.scrollBy(0, 0);

        var ret = window.__qsaels;
        delete window.__qsaels;
        return ret;
    };

    document.querySelector = function(selector) {
        return document.querySelectorAll(selector)[0];
    };
}
