from plone.app.controlpanel.filter import FilterControlPanelAdapter

def setupVarious(context):

    # Ordinarily, GenericSetup handlers check for the existence of XML files.
    # Here, we are not parsing an XML file, but we use this text file as a
    # flag to check that we actually meant for this import step to be run.
    # The file is found in profiles/default.
    if context.readDataFile('pareto.tinymceplugin.iframe_various.txt') is None:
        return
    
    # Add additional setup code here
    portal = context.getSite()
    FCPA = FilterControlPanelAdapter(portal)
    if u'iframe' not in FCPA.custom_tags:
        ct = FCPA.custom_tags
        tags.append(u'iframe')
        tags.sort()
        FCPA.custom_tags = ct
    
    return
