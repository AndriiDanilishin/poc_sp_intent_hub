using SourcingService as service from '../../srv/service';

annotate service.Requests with @(

    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Label: 'Source', Value: source },
            { $Type: 'UI.DataField', Label: 'Description', Value: description },
            { $Type: 'UI.DataField', Label: 'Status', Value: status }
        ],
    },

    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'GeneralInfo',
            Label : 'General Information',
            Target: '@UI.FieldGroup#GeneratedGroup'
        }
    ],

    UI.LineItem: [
        { $Type: 'UI.DataField', Label: 'Source', Value: source },
        { $Type: 'UI.DataField', Label: 'Description', Value: description },
        { $Type: 'UI.DataField', Label: 'Status', Value: status },

        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Enrich with AI',
            Action: 'SourcingService.enrichWithAI',
            InvocationGrouping: #CHANGE_SET
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Create Project',
            Action: 'SourcingService.createProject',
            InvocationGrouping: #CHANGE_SET
        }
    ],

    UI.Identification: [
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Enrich with AI',
            Action: 'SourcingService.enrichWithAI'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Create Project',
            Action: 'SourcingService.createProject'
        }
    ]
);