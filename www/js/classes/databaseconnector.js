'use strict'

controllers.factory('DatabaseConnector', [
    '$ionicPlatform', 'Error', 'Callback', 'Util', '$timeout',
    function($ionicPlatform, Error, Callback, Util, $timeout) {

        var DatabaseConnector = augment.defclass({
            constructor: function(tableName) {
                this._tableName = tableName;
            },

            /**
             * Delete Model from database
             * @param {string} id to be deleted from table
             * @param  {Callback} onSuccess
             * @param  {Callback} onFail
             */
            deleteById: function(id, onSuccess, onFail) {

                var deleteQuery = "delete from " + this._tableName + " where id = " + id + ";";
                DatabaseConnector.Query(deleteQuery, [], onSuccess, onFail);
            },

            /**
             * Udatep Model from database
             * @param  {Callback} onSuccess [description]
             * @param  {Callback} onFail    [description]
             */
            updateById: function(id, params, onSuccess, onFail) {

                var setQuery = 'SET ';
                var values = [];

                for (var column in params) {
                    setQuery += column + ' = ?, ';
                    values.push(params[column]);
                }
                setQuery = setQuery.substring(0, setQuery.length - 2);

                var updateQuery = "UPDATE " + this._tableName + " " + setQuery + " WHERE id = " + id + ";";
                /*alert(updateQuery);
				alert(JSON.stringify(values));*/
                DatabaseConnector.Query(updateQuery, values, onSuccess, onFail);
            },

            /**
             * Create a new Database record
             * @param {Class} ChildModel child of model class
             * @param {JSON} params to insert in column: value format
             * @param {Callback} onSuccess
             * @param {Callback} onFail
             */
            insert: function(ChildModel, params, onSuccess, onFail) {

                var columns = '';
                var questionMarks = '';
                var values = [];

                for (var column in params) {
                    columns += column + ', ';
                    questionMarks += '?' + ', ';
                    values.push(params[column]);
                }

                var columns = '(' + columns.substring(0, columns.length - 2) + ')';
                var questionMarks = '(' + questionMarks.substring(0, questionMarks.length - 2) + ')';

                var queryInsert = "INSERT INTO " + this._tableName + columns + " VALUES" + questionMarks;
                var onInserted = new Callback(function(result) {

                    params['id'] = result.insertId;
                    var childModel = new ChildModel(params);
                    /*Util.Alert(childModel.toJson());*/
                    onSuccess.fire(childModel);
                });

                //alert('insert query : ' + queryInsert);
                DatabaseConnector.Query(queryInsert, values, onInserted, onFail);
            },

            /**
             * Find Models in Database
             * @param {JSON} config contains onSuccess, onFail, ChildModel, [isDistinct], [tableName], [columns], [conditions], [conditionType], [order], [limit]
             */
            select: function(config) {

                var tableName = this._tableName;
                var conditionsJson;
                var whereCondition = '';
                var conditionValues = [];
                var limit = '';
                var order = '';
                var columns = '*';
                var isDistinct = config.isDistinct || true;
                var distinct = isDistinct ? "distinct " : "";

                if (config.conditions != null) {
                    conditionsJson = DatabaseConnector._FormatConditions(config.conditions, config.conditionType);
                    whereCondition = ' WHERE ' + conditionsJson.conditions;
                    conditionValues = conditionsJson.values;
                }

                if (config.limit != null) {
                    limit = " limit 0, " + config.limit;
                }

                if (config.order != null) {
                    
                    order = Util.String(" order by {0} {1}", [config.order.by, config.order.type]); // " order by id " + config.order;
                }

                if (config.columns != null) {
                    columns = "";
                    for (var i = 0; i < config.columns.length - 1; i++) {
                        columns += config.columns[i] + ", ";
                    }
                    columns += config.columns[config.columns.length - 1];

                }
                var querySelect = "select " + distinct + columns + " from " + tableName + whereCondition + order + limit + ";";
                var onSearched = new Callback(function(result) {

                    var config = onSearched.getExtras();
                    var ClassName = config.model || config.Model || config.ChildModel;
                    if (config.limit != null && config.limit == 1) {
                        var childModel = new ClassName(result.rows.item(0));
                        config.onSuccess.fire(childModel);
                    } else {
                        var childModelList = [];

                        for (var i = 0; i < result.rows.length; i++) {
                            var temp = new ClassName(result.rows.item(i));
                            childModelList.push(temp);
                        }
                        config.onSuccess.fire(childModelList);
                    }
                });
                onSearched.setExtras(config);
                /*alert(querySelect);
                Util.Alert(conditionValues);*/
                //console.log(query);
                DatabaseConnector.Query(querySelect, conditionValues, onSearched, config.onFail);
            },

            /**
             * Find First Model in Database
             * @param {JSON} config contains onSuccess, onFail, ChildModel, [conditions], [conditionType]
             */
            selectFirst: function(config) {
                config.order = {
                    by: "id",
                    type: DatabaseConnector.ORDER.FIRST
                };
                config.limit = 1;
                this.select(config);
            },

            /**
             * Find Last Model in Database
             * @param {JSON} config contains onSuccess, onFail, ChildModel, [conditions], [conditionType]
             */
            selectLast: function(config) {
                config.order = {
                    by: "id",
                    type: DatabaseConnector.ORDER.LAST
                };
                config.limit = 1;
                this.select(config);
            }


        });

        //DatabaseConnector Connector
        DatabaseConnector.Connector = null;

        DatabaseConnector.Reset = function () {
            DatabaseConnector.Connector = null;
        }

        /**
         * Get DatabaseConnector Instance When ready
         * @param  {Callback} onSuccess called when DatabaseConnector is ready
         * @param  {Callback} onFail
         */
        DatabaseConnector.getConnector = function(onSuccess, onFail) {

            var self = this;

            if (DatabaseConnector.Connector != null) {
                onSuccess.fire(DatabaseConnector.Connector);
                return;
            }

            // Wait for Cordova to load
            $ionicPlatform.ready(function() {

                if (window.sqlitePlugin == null) {
                    var error = new Error("sqlite plugin is undefined", true);
                    onFail.fire(error);
                    return;
                }


                DatabaseConnector.Connector = window.sqlitePlugin.openDatabase({
                    name: CONFIG.DATABASE.NAME
                });

                DatabaseConnector.Connector.transaction(function(tx) {
                    /*tx.executeSql('DROP TABLE IF EXISTS Language');
                    tx.executeSql('DROP TABLE IF EXISTS Category');
                    tx.executeSql('DROP TABLE IF EXISTS SubCategory');
                    tx.executeSql('DROP TABLE IF EXISTS QA');*/

                    var tablesCreated = 0,
                        isOnSuccessCalled = false;
                    for (var i = 0; i < CONFIG.DATABASE.SCHEMA.TABLES.length; i++) {

                        tx.executeSql(CONFIG.DATABASE.SCHEMA.TABLES[i], [], function() {
                            tablesCreated++;
                            if (tablesCreated == CONFIG.DATABASE.SCHEMA.TABLES.length)
                                onSuccess.fire(DatabaseConnector.Connector);

                        }, function(e) {


                            if (DatabaseConnector.Connector == null) {
                                var error = new Error(e.message, true);
                                config.onFail.fire(error);
                                return;
                            }

                            if (DatabaseConnector.Connector != null && !isOnSuccessCalled) {
                                isOnSuccessCalled = true;
                                onSuccess.fire(DatabaseConnector.Connector);
                                return;
                            }

                        });
                    }

                }, function(e) {
                    var error = new Error(e.message, true);
                    config.onFail.fire(error);
                });

            });

        }

        /**
         * Delete DatabaseConnector from DatabaseConnector
         * @param {string} query SQL query to make
         * @param {Array} values values to bind to the query
         * @param  {Callback} onSuccess
         * @param  {Callback} onFail
         */
        DatabaseConnector.Query = function(query, values, onSuccess, onFail) {

            /*Util.Alert(values);
			alert(query);*/
            var onConnected = new Callback(function(db) {

                db.transaction(function(tx) {
                    tx.executeSql(query, values, function(tx, result) {
                        onSuccess.fire(result);
                    }, function(e) {

                        alert(Util.String("{0} error: {1}", [query, e.message]));
                        Util.Alert(values);
                        var error = new Error(e.message, true);
                        onFail.fire(error);
                    });
                });

            });

            DatabaseConnector.getConnector(onConnected, onFail);
        }

        /**
         * format conditions to .. ?, ? and pass array of values
         * @param  {JSON} params conditions to format
         * @param  {string} conditionType AND or OR to concatenate
         */
        DatabaseConnector._FormatConditions = function(params, conditionType) {

            if (conditionType == null)
                conditionType = DatabaseConnector.CONDITION_OPERATOR.AND;

            var conditions = '';
            var values = [];

            //Util.Alert(params);
            for (var i = 0; i < params.length; i++) {
                conditions += params[i][0];

                if (params[i][2] == null)
                    conditions += ' IS NULL';
                else if (params[i][2] == DatabaseConnector.CONDITION.NOT_NULL)
                    conditions += ' IS NOT NULL';
                else {
                    conditions += ' ' + params[i][1] + ' ?';
                    values.push(params[i][2]);
                }

                conditions += ' ' + conditionType + ' ';
            };

            conditions = conditions.substring(0, conditions.length - (conditionType.length + 2));


            return {
                conditions: conditions,
                values: values
            };
        }

        /**
         * Condition Operators
         * @type {String}
         */
        DatabaseConnector.CONDITION_OPERATOR = {
            AND: 'AND',
            OR: 'OR'
        };

        DatabaseConnector.CONDITION = {
            NOT_NULL: 'NOT_NULL'
        }

        /**
         * Order by
         * @type {String}
         */
        DatabaseConnector.ORDER = {
            FIRST: 'asc',
            LAST: 'desc'
        };

        return DatabaseConnector;
    }
])