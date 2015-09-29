application.factory('ModelName', [
    'Model',
    function(Model) {
        'use strict';

        var ModelName = augment(Model, function(parent) {
            /**
             * ModelName Constructor
             * @param  {row} resulted row from select statement
             */
            this.constructor = function(row) {
            	this._fields = ["field"];
            	this._tableName = "ModelName";
                this._modelType = ModelName;
                parent.constructor.call(this, row);
            }
        });

        return ModelName;
    }
]);