if (!window.pareto) {
    window.pareto = {};
}

window.pareto.tinymce_iframe = new (function() {
    var tinymce_iframe = this;

    var parentPareto;
    var current = window;
    while (!parentPareto) {
        current = current.parent || current.opener;
        parentPareto = current.pareto;
    }

    // bweh, mcTabs (Tiny's own tab manager) demands the tab elements are
    // of type 'fieldset' in an old version, and of type 'div' in a later,
    // we want to support both... so... let's implement our own tab manager! :|
    var TabManager = window.pareto.TabManager = function(el) {
        this.tabsEl = el;
        var tabLinks = this.tabLinks = el.getElementsByTagName('a');
        parentPareto.addEventListener(
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
            var iframe = selected.getElementsByTagName('iframe')[0];
            document.querySelector('[name=url]').value = iframe.src;
            document.querySelector('[name=width]').value =
                iframe.getAttribute('width') || '';
            document.querySelector('[name=height]').value =
                iframe.getAttribute('height') || '';
            var style = iframe.getAttribute('style') || '';
            style = style.replace(/position: ?absolute;? ?/gi, '');
            style = style.replace(/z-index: ?\d+;? ?/gi, '');
            document.querySelector('[name=style]').value = style;
        }

        this.editor = editor;

        parentPareto.addEventListener(
            document.querySelector('form'), 'submit',
            this.insert.bind(this, editor));
        parentPareto.addEventListener(
            document.querySelector('[type=submit]'), 'click',
            this.insert.bind(this, editor));

        parentPareto.addEventListener(
            document.querySelector('[name=cancel]'), 'click',
            tinyMCEPopup.close.bind(tinyMCEPopup));

        this.tabs = new TabManager(document.querySelector('ul'));
    };

    IframePlugin.prototype.insert = function(editor) {
        var url = document.querySelector('[name=url]').value;
        var errors = [];
        if (!url) {
            // we need a url...
            errors.push(editor.translate('{#iframe.no_url_error}'));
        }
        var width =
            (document.querySelector('[name=width]').value || '').trim();
        if (width && '' + parseInt(width) != width) {
            errors.push(editor.translate('{#iframe.invalid_width}'));
        }
        var height =
            (document.querySelector('[name=height]').value || '').trim();
        if (height && '' + parseInt(height) != height) {
            errors.push(editor.translate('{#iframe.invalid_height}'));
        }
        // we don't check style for errors...
        var style = document.querySelector('[name=style]').value;
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
                html += ' style="' + parentPareto.entitize(style) + '"';
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
    parentPareto.addEventListener(window, 'load', function(plugin) {
        document.body.style.display = '';
        document.getElementById('url').focus();
    }.bind(window, plugin));
})();
