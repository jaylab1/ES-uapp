controllers.factory('Util', [

    function() {
        'use strict';

        var Util = augment.defclass({

            constructor: function() {

            }
        });

        
        Util.Alert = function(object) {
            var jsonStringified = "";
            try {
                jsonStringified = JSON.stringify(object);
            } catch (e) {
                jsonStringified = object;
            }

            alert(jsonStringified);
        };

        Util.IsBrowser = function () {
            return typeof cordova === "undefined";
        };

        
        Util.ToTwoDigits = function(number) {
            var baseTwo = number;
            if (number < 10 && number > -10) {
                baseTwo = "0" + number;
            }

            return baseTwo;
        };

        
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

        
        Util.Find = function(list, isMatched) {

            for (var i = 0; i < list.length; i++) {
                if (isMatched(list[i]))
                    return list[i];
            }
            return null;
        };

        
        Util.IsString = function(value) {
            return typeof value === 'string';
        };

        
        Util.InArray = function(value, list) {
            if (list.indexOf(value) === -1)
                return false;

            return true;
        };

        
        Util.PushUnique = function(value, list, isMatched) {
            var element = Util.Find(list, isMatched);

            if (element != null) {
                return;
            }

            list.push(value);
        }

        
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

        
        Util.IsFunction = function(value) {
            return typeof value === 'function';
        }

        
        Util.IsWindow = function(obj) {
            return obj && obj.window === obj;
        }

        
        Util.RandomNumber = function(min, max) {
            if (!min) min = 0;
            if (!max) max = 1000;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }


        
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