sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"sourcingrequests/test/integration/pages/RequestsList",
	"sourcingrequests/test/integration/pages/RequestsObjectPage"
], function (JourneyRunner, RequestsList, RequestsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('sourcingrequests') + '/test/flpSandbox.html#sourcingrequests-tile',
        pages: {
			onTheRequestsList: RequestsList,
			onTheRequestsObjectPage: RequestsObjectPage
        },
        async: true
    });

    return runner;
});

