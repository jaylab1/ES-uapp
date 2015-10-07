controllers.factory('Util', [

    function() {
        'use strict';

        var Util = augment.defclass({

            constructor: function() {

            }
        });

        /**
         * Alert an object
         * @param {Object} object to alert
         */
        Util.Alert = function(object) {
            var jsonStringified = "";
            try {
                jsonStringified = JSON.stringify(object);
            } catch (e) {
                jsonStringified = object;
            }

            alert(jsonStringified);
        };

        /**
         * Make number at least 2 digits
         * @param {number} number to conver
         * @return {String} 2 digits number
         */
        Util.ToTwoDigits = function(number) {
            var baseTwo = number;
            if (number < 10 && number > -10) {
                baseTwo = "0" + number;
            }

            return baseTwo;
        };

        /**
         * Format Milliseconds into HH:MM:SS format
         * @param {String} string format of time
         */
        Util.FormatMilliseconds = function(milliseconds) {
            var days, hours, minutes, seconds;
            seconds = Math.floor(milliseconds / 1000);
            minutes = Math.floor(seconds / 60);
            seconds = seconds % 60;
            hours = Math.floor(minutes / 60);
            minutes = minutes % 60;
            days = Math.floor(hours / 24);
            hours = hours % 24;

            return Util.ToTwoDigits(hours) + ":" + Util.ToTwoDigits(minutes) + ":" + Util.ToTwoDigits(seconds);

        };

        /**
         * Format string
         * @param {string} str to format
         * @param {array} args to replace
         */
        Util.String = function(str, args) {
            var regex = new RegExp("{-?[0-9]+}", "g");

            return str.replace(regex, function(item) {
                var intVal = parseInt(item.substring(1, item.length - 1));
                var replace;
                if (intVal >= 0) {
                    replace = args[intVal];
                } else if (intVal === -1) {
                    replace = "{";
                } else if (intVal === -2) {
                    replace = "}";
                } else {
                    replace = "";
                }
                return replace;
            });
        };

        /**
         * Find some object in a list
         * @param {Array}  list to search in
         * @param {function} isMatched function to search with
         */
        Util.Find = function(list, isMatched) {

            for (var i = 0; i < list.length; i++) {
                if (isMatched(list[i]))
                    return list[i];
            }
            return null;
        };

        /* @description
         * Determines if a reference is a `String`.
         *
         * @param {*} value Reference to check.
         * @returns {boolean} True if `value` is a `String`.
         */
        Util.IsString = function(value) {
            return typeof value === 'string';
        };

        /**
         * check if some object in a list
         * @param {Array}  value to search for
         * @param {Array}  list to search in
         * @return {Boolean} if exists or not
         */
        Util.InArray = function(value, list) {
            if (list.indexOf(value) === -1)
                return false;

            return true;
        };

        /**
         * push object in array
         * @param {*}  value to push in
         * @param {Array}  list to push in
         */
        Util.PushUnique = function(value, list, isMatched) {
            var element = Util.Find(list, isMatched);

            if (element != null) {
                return;
            }

            list.push(value);
        }

        /**
         * @param {*} obj
         * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
         *                   String ...)
         */
        Util.IsArrayLike = function(obj) {
            var NODE_TYPE_ELEMENT = 1;

            if (obj == null || Util.IsWindow(obj)) {
                return false;
            }

            var length = obj.length;

            if (obj.nodeType === NODE_TYPE_ELEMENT && length) {
                return true;
            }

            return Util.IsString(obj) || Array.isArray(obj) || length === 0 ||
                typeof length === 'number' && length > 0 && (length - 1) in obj;
        }

        /**
         * check if param is a function
         * @param {*} value Reference to check.
         * @returns {boolean} True if `value` is a `Function`.
         */
        Util.IsFunction = function(value) {
            return typeof value === 'function';
        }

        /**
         * Checks if `obj` is a window object.
         *
         * @param {*} obj Object to check
         * @returns {boolean} True if `obj` is a window obj.
         */
        Util.IsWindow = function(obj) {
            return obj && obj.window === obj;
        }

        /**
         * Returns a random integer between min (inclusive) and max (inclusive)
         * Using Math.round() will give you a non-uniform distribution!
         */
        Util.RandomNumber = function(min, max) {
            if (!min) min = 0;
            if (!max) max = 1000;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }


        /*
         * @param {Object|Array} obj Object to iterate over.
         * @param {Function} iterator Iterator function.
         * @param {Object=} context Object to become context (`this`) for the iterator function.
         * @returns {Object|Array} Reference to `obj`.
         */
        Util.ForEach = function(obj, iterator, context) {
            var key, length;
            if (obj) {
                if (Util.IsFunction(obj)) {
                    for (key in obj) {
                        // Need to check if hasOwnProperty exists,
                        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
                        if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
                            iterator.call(context, obj[key], key, obj);
                        }
                    }
                } else if (Array.isArray(obj) || Util.IsArrayLike(obj)) {
                    var isPrimitive = typeof obj !== 'object';
                    for (key = 0, length = obj.length; key < length; key++) {
                        if (isPrimitive || key in obj) {
                            iterator.call(context, obj[key], key, obj);
                        }
                    }
                } else if (obj.forEach && obj.forEach !== Util.ForEach) {
                    obj.forEach(iterator, context, obj);
                } else {
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            iterator.call(context, obj[key], key, obj);
                        }
                    }
                }
            }
            return obj;
        };

        /**
         * check if string ends with suffix
         * @param {String} str    to test
         * @param {String} suffix to search for in the string
         * @return {Boolean} if it exist or not
         */
        Util.EndWith = function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }

        Util.Base64 = function(type, data) {
            return Util.String("data:image/{0};base64,{1}", [type, data]);
        };

        Util.RandomString = function(length) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < length; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        };

        return Util;


    }
]);