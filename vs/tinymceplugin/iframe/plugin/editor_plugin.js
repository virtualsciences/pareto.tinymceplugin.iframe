(function() {
    if (!window.vs) {
        window.vs = {};
    }

    // we expose these so the plugin code (executed in the popup window)
    // can access them
    var addEventListener = window.vs.addEventListener =
            function(els, name, handler) {
        if (els.length === undefined) {
            els = [els];
        }
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.addEventListener) {
                el.addEventListener(name, handler, true);
            } else {
                el.attachEvent('on' + name, handler);
            }
        }
    };

    var setStyles = window.vs.setStyles = function(el, styles) {
        for (var attr in styles) {
            el.style[attr] = styles[attr];
        }
    };

    var entitize = window.vs.entitize = function(s) {
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/"/g, '&quot;');
        s = s.replace(/'/g, '&apos;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        return s;
    };

    // stinky Tiny seems to demand this to be a dict-style object literal
    // (I assume it does a for (var attr in obj) to copy methods or sth,
    // if I use a 'normal' prototype instance it fails to find my functions)
    var iframePopup = {
        'init': function(editor, url) {
            this.baseUrl = url;

            editor.addCommand('mce_iframe', function() {
                editor.windowManager.open(
                    {'file': url + '/window.html',
                        'width': 600 + editor.getLang('iframe.delta_width', 0),
                        'height':
                            400 + editor.getLang('iframe.delta_height', 0),
                        'inline': 1},
                    {'plugin_url': url});
            });

            editor.addButton('iframe', {
                'title': 'iframe.desc',
                'cmd': 'mce_iframe',
                'image': url + '/iframe.gif'});

            editor.onClick.add(this.onNodeChange.bind(this, editor));
            editor.onChange.add(this.onNodeChange.bind(this, editor));

            // when saving, editing source, etc., we want our container and
            // overlay not in the html
            editor.onGetContent.add(this.onGetContent.bind(this));

            // on any edit action (paste, undo, execcommand, etc.) we want to
            // make sure that any iframes that may be added have a container
            // and overlay, and that any remnants of containers/overlays that
            // don't have an iframe anymore are removed
            editor.onSetContent.add(this.sanitize.bind(this, editor));
            editor.onBeforeGetContent.add(this.sanitize.bind(this, editor));
            editor.onUndo.add(this.sanitize.bind(this, editor));
            editor.onPaste.add(this.sanitize.bind(this, editor));
            editor.onExecCommand.add(this.sanitize.bind(this, editor));

            editor.onLoadContent.add(this.onLoadContent.bind(this, editor));
        },
        'onLoadContent': function(editor) {
            // we register a click handler on the entire document, this
            // because containers added by copy/paste and undo may not have
            // a handler... registering the handler on the document instead
            // allows us to handle clicks on any of the containers without
            // having to check whether event handlers are registered, or
            // re-register all the time
            window.vs.addEventListener(
                editor.dom.doc.documentElement,
                'click',
                this.onDocumentClick.bind(this, editor));

            // register keydown on document so we can deal with backspace
            // and del presses in a sane way
            window.vs.addEventListener(
                editor.dom.doc,
                'keydown',
                this.onKeyDown.bind(this, editor));
        },
        'getInfo': function() {
            return {
                'longname': 'iframe',
                'author': 'Thijs Jonkman and THijs',
                'authorurl': 'http://vs.nl',
                'infourl': 'http://vs.nl',
                'version': '2.0'};
        },
        'sanitize': function(editor) {
            this.cleanup(editor);
            this.addContainers(editor);
        },
        'onGetContent': function(editor, content) {
            /* remove the container/overlay divs from the serialized content
            */
            var html = content.content;
            var reg =
                new RegExp(
                    '<span class="iframe-container">(.|\r|\n)*' +
                    '<\/span>[^<]*<\/span>',
                    'mi');
            while (true) {
                var match = reg.exec(html);
                if (!match) {
                    break;
                }
                var open = /<iframe[^>]*>/i.exec(match[0])[0];
                open = open.replace(/position: ?absolute;? ?/gi, '');
                open = open.replace(/z-index: ?\d+;? ?/gi, '');
                open = open.replace(/frameborder="\d+" /gi, '');
                open = open.replace(/scrolling="[^"]*" /gi, '');
                html = html.replace(match[0], open + '</iframe>');
            }
            content.content = html;
        },
        'addContainers': function(editor) {
            /* add containers around iframes, if they don't have one yet

                rather than adding containers only around newly added iframes,
                we just fix any iframe that should be fixed, usually this
                should not be too useful, but we really have no clue what
                people do with their content and it's really hard to figure
                out what a newly added iframe is and such, so just checking
                and processing each iframe every time is a solid and simple
                solution (we don't care too much about CPU-cycles, prolly
                never a real issue)
            */
            var iframes = editor.dom.doc.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                var iframe = iframes[i];
                if (iframe.parentNode.className == 'iframe-container') {
                    continue;
                }
                window.vs.setStyles(
                    iframe,
                    {'position': 'absolute',
                        'z-index': 0});
                var container = editor.dom.doc.createElement('span');
                container.className = 'iframe-container';
                container.contentEditable = false;
                // XXX deal with margin and border
                window.vs.setStyles(
                    container,
                    {'display': 'inline',
                        'display': 'inline-block'});
                iframe.parentNode.replaceChild(container, iframe);
                container.appendChild(iframe);

                var overlay = editor.dom.doc.createElement('span');
                overlay.contentEditable = false;
                window.vs.setStyles(
                    overlay,
                    {'position': 'relative',
                        'display': 'block',
                        'z-index': 1,
                        'width': iframe.offsetWidth + 'px',
                        'height': iframe.offsetHeight + 'px',
                        'background-image':
                            'url(' + this.baseUrl + '/bg_unsel.png)'});
                container.appendChild(overlay);

                container.unselectable = 'on';
                container.onselectstart = function() {return false;};
                window.vs.setStyles(
                    container,
                    {'user-select': 'none'});
            }
        },
        'removeContainers': function(editor) {
            /* remove containers from iframes
            */
            var iframes = editor.dom.doc.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                var iframe = iframes[i];
                if (iframe.parentNode.className == 'iframe-container') {
                    iframe.parentNode.parentNode.replaceChild(
                        iframe, iframe.parentNode);
                }
            }
        },
        'cleanup': function(editor) {
            /* remove empty containers, if any
            */
            var divs = editor.dom.doc.getElementsByTagName('span');
            for (var i = 0; i < divs.length; i++) {
                var div = divs[i];
                if (div.className == 'iframe-container') {
                    if (!div.getElementsByTagName('iframe').length) {
                        div.parentNode.removeChild(div);
                    }
                }
            }
        },
        'onNodeChange': function(editor) {
            var selected = editor.selection.getNode();
            var activate =
                (selected.className == 'iframe-container' ||
                    (selected.parentnode &&
                        selected.parentNode.className == 'iframe-container'));
            editor.controlManager.setActive('iframe', activate);
        },
        'onDocumentClick': function(editor, e) {
            alert('click');
            var target = e.target;
            if (!target) {
                target = e.srcElement;
            }
            var containers = target.ownerDocument.getElementsByTagName('span');
            for (var i = 0; i < containers.length; i++) {
                var container = containers[i];
                if (container.className != 'iframe-container') {
                    continue;
                }
                container.lastChild.style.backgroundImage =
                    'url(' + this.baseUrl + '/bg_unsel.png)';
            }
            var container = target;
            if (container.className != 'iframe-container') {
                container = container.parentNode;
            }
            if (!container || container.className != 'iframe-container') {
                return;
            }
            // the currently selected item is an iframe (or, a wrapper for an
            // iframe, to be precise), mark as selected and make the button
            // active
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            container.lastChild.style.backgroundImage =
                'url(' + this.baseUrl + '/bg_sel.png)';
            editor.selection.select(container, true);
            return false;
        },
        'onKeyDown': function(editor, e) {
            switch (e.keyCode) {
                case 8:
                case 46:
                    var selected = editor.selection.getNode();
                    if (selected.className != 'iframe-container') {
                        selected = selected.parentNode;
                    }
                    if (selected &&
                            selected.className == 'iframe-container') {
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;
                        }
                        selected.parentNode.removeChild(selected);
                        return false;
                    }
            }
        }};

    tinymce.PluginManager.requireLangPack('iframe');
    tinymce.create('tinymce.plugins.iframe', iframePopup);
    tinymce.PluginManager.add('iframe', tinymce.plugins.iframe);
})();
