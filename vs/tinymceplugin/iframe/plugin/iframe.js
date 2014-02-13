if (!window.vs) {
    window.vs = {};
}

window.vs.tinymce_iframe = new (function() {
    var tinymce_iframe = this;

    var parentVirtual Sciences;
    var current = window;
    while (!parentVirtual Sciences) {
        current = current.parent || current.opener;
        parentVirtual Sciences = current.vs;
    }

    var getByName = function(name) {
        return document.getElementsByName(name)[0];
    };

    var getByTagName = function(container, tagName) {
        return container.getElementsByTagName(tagName)[0];
    };

    // bweh, mcTabs (Tiny's own tab manager) demands the tab elements are
    // of type 'fieldset' in an old version, and of type 'div' in a later,
    // we want to support both... so... let's implement our own tab manager! :|
    var TabManager = window.vs.TabManager = function(el) {
        this.tabsEl = el;
        var tabLinks = this.tabLinks = el.getElementsByTagName('a');
        parentVirtual Sciences.addEventListener(
            tabLinks, 'click', this.onTabLinkClick.bind(this));

        var firstId = this.getIdFromLink(tabLinks[0]);
        this.showTab(firstId);
    };

    TabManager.prototype.onTabLinkClick = function(e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
        var link = e.target;
        if (!link) {
            link = e.srcElement;
        }
        while (link.nodeName.toLowerCase() != 'a') {
            link = link.parentNode;
        }
        var id = this.getIdFromLink(link);
        this.showTab(id);
        return false;
    };

    TabManager.prototype.showTab = function(id) {
        var toSelect;
        for (var i = 0; i < this.tabLinks.length; i++) {
            var link = this.tabLinks[i];
            var linkId = this.getIdFromLink(this.tabLinks[i]);
            var display = 'none';
            if (linkId == id) {
                link.className += ' selected';
                display = 'block';
            } else {
                link.className = (link.className || '').replace(
                    / ?selected/g, '');
            }
            this.tabsEl.ownerDocument.getElementById(linkId).style.display =
                display;
        }
    };

    TabManager.prototype.getIdFromLink = function(link) {
        return link.href.substr(link.href.indexOf('#') + 1);
    };


    // the actual plugin
    var IframePlugin = tinymce_iframe.IframePlugin = function() {
        tinyMCEPopup.onInit.add(this.onInit.bind(this));
    };

    IframePlugin.prototype.onInit = function(editor) {
        var selected = editor.selection.getNode();
        if (selected && selected.nodeName.toLowerCase() == 'iframe') {
            selected = selected.parentNode;
        }
        if (selected && selected.nodeName.toLowerCase() == 'span' &&
                selected.className == 'iframe-container') {
            var iframe = getByTagName(selected, 'iframe');
            getByName('url').value = iframe.src;
            getByName('width').value = iframe.getAttribute('width') || '';
            getByName('height').value = iframe.getAttribute('height') || '';
            var style = iframe.getAttribute('style') || '';
            if (!style.replace) {
                // stinking IE 7, getAttribute() returns an object... well
                // then, a stinky hack for a stinky browser :|
                style = /<IFRAME[^>]*style="([^"]+)"/.exec(
                    iframe.parentNode.innerHTML)[1];
            }
            style = style.replace(/position: ?absolute;? ?/gi, '');
            style = style.replace(/z-index: ?\d+;? ?/gi, '');
            getByName('style').value = style;
        }

        this.editor = editor;

        parentVirtual Sciences.addEventListener(
            getByTagName(document, 'form'), 'submit',
            this.insert.bind(this, editor));
        parentVirtual Sciences.addEventListener(
            getByName('insert'), 'click',
            this.insert.bind(this, editor));

        parentVirtual Sciences.addEventListener(
            getByName('cancel'), 'click',
            tinyMCEPopup.close.bind(tinyMCEPopup));

        this.tabs = new TabManager(getByTagName(document, 'ul'));
    };

    IframePlugin.prototype.insert = function(editor) {
        var url = getByName('url').value;
        var errors = [];
        if (!url) {
            // we need a url...
            errors.push(editor.translate('{#iframe.no_url_error}'));
        }
        var width =
            (getByName('width').value || '').trim();
        if (width && '' + parseInt(width) != width) {
            errors.push(editor.translate('{#iframe.invalid_width}'));
        }
        var height =
            (getByName('height').value || '').trim();
        if (height && '' + parseInt(height) != height) {
            errors.push(editor.translate('{#iframe.invalid_height}'));
        }
        // we don't check style for errors...
        var style = getByName('style').value;
        if (errors.length) {
            alert(errors.join(', '));
            return;
        }

        // if there's currently an iframe selected, change the attrs of
        // that, if not, create one
        /*
        var selected = editor.selection.getNode();
        if (selected.nodeName.toLowerCase() == 'iframe' ||
                (selected.nodeName.toLowerCase() == 'span' &&
                    selected.className == 'iframe-container')) {
            if (selected.nodeName.toLowerCase() == 'span') {
                selected = selected.firstChild;
            }
            selected.src = url;
            selected.mce_src = url;
            selected.width = width;
            selected.height = height;
            var styles = this.processStyleString(style);

            //selected.style = style;
        } else {
        */
            var html = '<iframe src="' + encodeURI(url) + '"';
            if (width) {
                html += ' width="' + width + '"';
            }
            if (height) {
                html += ' height="' + height + '"';
            }
            if (style) {
                html += ' style="' + parentVirtual Sciences.entitize(style) + '"';
            }
            html += '></iframe>';

            editor.execCommand('mceInsertContent', false, html);
            editor.execCommand('mceRepaint');
        //}

        tinyMCEPopup.close();
    };

    IframePlugin.prototype.onTabLabelClick = function(e) {
        var target = e.target;
        if (!target) {
            target = e.srcElement;
        }
        while (target.nodeName.toLowerCase() != 'a') {
            target = target.parentNode;
            if (!target || target.nodeType != 1) {
                // this should never happen...
                return;
            }
        }
        var href = target.href;
        var panel_id = href.substr(href.indexOf('#') + 1);
        mcTabs.displayTab(target.parentNode.id, panel_id);
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
        return false;
    };

    // we initialize the plugin before onload fires, sometimes (FF) onload
    // seems to fire after tinyMCEPopup.onInit(), for which we want to register
    // handlers in the plugin...
    var plugin = tinymce_iframe.iframePlugin = new IframePlugin();
    parentVirtual Sciences.addEventListener(window, 'load', function(plugin) {
        document.body.style.display = '';
        document.getElementById('url').focus();
    }.bind(window, plugin));
})();
