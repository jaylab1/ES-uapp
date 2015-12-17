application.factory('Share', [
    'Model', 'Http',
    function(Model, Http) {
        'use strict';

        var Share = augment(Model, function(parent) {
            
            this.constructor = function(row) {
            	this._fields = ["image", "title", "code"];
            	this._tableName = "Share";
                this._modelType = Share;
                parent.constructor.call(this, row);
            };
        });

        return Share;
    }
]);