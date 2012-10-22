function init() {
    tinyMCEPopup.resizeToInnerSize();
}

function insertiframe() {
    var iframetext,
        iframeUrl = document.getElementById('iframeUrl').value,
        iframeWidth = document.getElementById('iframeWidth').value,
        iframeHeight = document.getElementById('iframeHeight').value,
        iframeStyle = document.getElementById('iframeStyle').value;

    if (iframeUrl == '') {
        alert('{#iframe.error}');
    } else {
        iframetext = '<iframe src="'+ iframeUrl +'" frameborder="0"';
        if (iframeWidth !== '') {
            iframetext += ' width="'+ iframeWidth +'"';
        }
        if (iframeHeight !== '') {
            iframetext += ' height="'+ iframeHeight +'"';
        }
        if (iframeStyle !== '') {
            iframetext += ' style="'+ iframeStyle +'"';
        }
        iframetext += '></iframe>';
        iframetext += '<br style="clear: both;" />';

        if (window.tinyMCE) {
            tinyMCEPopup.editor.execCommand('mceInsertContent', false, iframetext);
            tinyMCEPopup.editor.execCommand('mceRepaint');
            tinyMCEPopup.close();
        }
    }

    return;
}