controllers.factory('Model', [
    '$ionicPlatform', 'DatabaseConnector', 'Util', '$timeout',
    function($ionicPlatform, DatabaseConnector, Util, $timeout) {
        'use strict';

        var Model = augment.defclass({
            constructor: function(row) {
                this.id = row && row.id ? row.id : null;

                if (this._tableName !== null) {
                    this._dbConnector = new DatabaseConnector(this._tableName);
                }

                Util.ForEach(row, function(value, key) {
                    if (Util.InArray(key, this._fields))
                        this[key] = value;
                }, this);

                this._bindMethods();

            },

            _bindMethods: function() {
                var self = this;
                this._modelType.Find = function() {
                    self._dbConnector.selectFirst({
                        model: self._modelType,
                        conditions: {
                            "id": self.id
                        },
                        onSuccess: onSuccess,
                        onFail: onError
                    });
                }
            },

            /**
             * get Primary Key
             * @return {integer}
             */
            getPrimaryKey: function() {
                return this.id;
            },

            /**
             * Set Primary Key
             * @param {integer} id
             */
            setPrimaryKey: function(id) {
                this.id = id;
            },

            /**
             * Delete Model from database
             * @param  {Callback} onSuccess
             * @param  {Callback} onFail
             */
            delete: function(onSuccess, onFail) {
                this._dbConnector.deleteById(this.getPrimaryKey(), onSuccess, onFail);
                return this;
            },

            /**
             * Udatep Model from database
             * @param  {Callback} onSuccess [description]
             * @param  {Callback} onFail    [description]
             */
            update: function(onSuccess, onFail) {
                this._dbConnector.updateById(this.getPrimaryKey(), this.toJson(), onSuccess, onFail);
                return this;
            },

            /**
             * save or update model in database
             * @param  {Callback} onSuccess
             * @param  {Callback} onFail
             */
            save: function(onSuccess, onFail) {

                if (this.id) {
                    this.update(onSuccess, onFail);
                } else {
                    this._dbConnector.insert(this._modelType, this.toJson(), onSuccess, onFail);
                }

                return this;
            },

            /**
             * parse object to string
             * @return {String} string descripes the model
             */
            toString: function() {
                return this.id;
            },

            /**
             * parse object to json
             * @return {JSON} current object
             */
            toJson: function() {
                var json = {
                    id: this.id
                };

                Util.ForEach(this, function(value, key) {
                    if (Util.InArray(key, this._fields))
                        json[key] = value;
                }, this);

                return json;
            },

            toArray: function() {
                var fields = [];

                Util.ForEach(this, function(value, key) {
                    if (Util.InArray(key, this._fields))
                        fields.push(value);
                }, this);

                return fields;
            },

            toList: function() {
                var json = {};

                Util.ForEach(this, function(value, key) {
                    if (Util.InArray(key, this._fields) && !Util.InArray(key, this._hidden)) 
                        json[key] = value;
                }, this);

                return json;
            }
        });

        Model.Find = function(model, params, order, onSuccess, onError) {
            var tmp = new model();
            var tableName = tmp._tableName;
            var dbConnector = new DatabaseConnector(tableName);

            if (Array.isArray(params)) {
                dbConnector.select({
                    model: model,
                    order: order,
                    conditions: params,
                    onSuccess: onSuccess,
                    onFail: onError
                });
            } else {
                dbConnector.selectFirst({
                    model: model,
                    order: order,
                    conditions: [
                        ["id", "=", params]
                    ],
                    onSuccess: onSuccess,
                    onFail: onError
                });
            }

        }

        return Model;
    }
]);