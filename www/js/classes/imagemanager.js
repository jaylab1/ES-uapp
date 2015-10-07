controllers.factory('ImageManager', [
    'Error', '$cordovaFileTransfer', 'Util', 'Http', 'Callback',
    function(Error, $cordovaFileTransfer, Util, Http, Callback) {
        'use strict';

        var ImageManager = augment.defclass({

            constructor: function() {
                this.cameraOptions = {};
                this.filePath = null;
                if (typeof(cordova) !== "undefined") {
                    this.cameraOptions = {
                        destinationType: Camera.DestinationType.FILE_URI,
                        quality: 60,
                        correctOrientation: true
                    };
                }

                /*if (ionic.Platform.isAndroid()) {
                    navigator.camera = navigator.fgCamera ? navigator.fgCamera : navigator.camera;
                }*/
            },
            encoded: function() {

                this.cameraOptions.destinationType = Camera.DestinationType.DATA_URL;
                return this;
            },
            locationed: function() {

                this.cameraOptions.destinationType = Camera.DestinationType.FILE_URI;
                return this;
            },
            /**
             * plugin: https://github.com/apache/cordova-plugin-camera
             * @param  {Callback} onSuccess
             * @param  {Callback} onError
             */
            fromCamera: function(onSuccess, onError) {
                var self = this;

                this.cameraOptions.sourceType = Camera.PictureSourceType.CAMERA;
                navigator.camera.getPicture(function(r) {

                    if (self.cameraOptions.destinationType === Camera.DestinationType.FILE_URI)
                        self.filePath = r;

                    onSuccess.fire(r);
                }, function(e) {
                    if (onError) onError.fire(e, true, true);
                }, this.cameraOptions);
                return this;
            },
            /**
             * plugin: https://github.com/cdibened/filechooser
             * @param  {Callback} onSuccess
             * @param  {Callback} onError
             */
            fromGallery: function(onSuccess, onError) {
                var self = this;

                this.cameraOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                navigator.camera.getPicture(function(r) {

                    if (self.cameraOptions.destinationType === Camera.DestinationType.FILE_URI)
                        self.filePath = r;

                    onSuccess.fire(r);
                }, function(e) {
                    if (onError) onError.fire(e, true, true);
                }, this.cameraOptions);

                /*if (ionic.Platform.isAndroid()) {
                    filechooser.open({}, function(data) {
                        var imageUrl = data.filepath;
                        //add file:/// in path if not exist
                        if (imageUrl.toUpperCase().search("FILE") !== 0) {
                            imageUrl = "file:///" + imageUrl;
                        }

                        self.filePath = imageUrl;
                        onSuccess.fire(imageUrl);
                    }, function(error) {
                        if (onError) onError.fire(new Error("Error happened while openning gallery"));
                    });
                } else {
                    this.cameraOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                    navigator.camera.getPicture(function(r) {
                        onSuccess.fire(r);
                    }, function(e) {
                        if (onError) onError.fire(e, true, true);
                    }, this.cameraOptions);
                }*/





                return this;
            },
            fileMetadata: function(onSuccess, onError) {
                var imageUrl = this.filePath;
                var defaultError = new Error("Error happened while getting file data");

                window.resolveLocalFileSystemURL(imageUrl, function(fileEntry) {
                    fileEntry.file(function(fileObj) {

                        fileObj.isImage = function() {
                            return fileObj.type.search("image") !== -1;
                        };

                        onSuccess.fire(fileObj);

                    }, function(err) {
                        $rootScope.onError.fire(defaultError);
                    });
                }, function(err) {
                    $rootScope.onError.fire(defaultError);
                });
            },
            /**
             * plugin: https://github.com/apache/cordova-plugin-file-transfer
             * @param  {String} url       to upload to
             * @param  {Callback} onSuccess
             * @param  {Callback} onError
             * @param  {JSON} others    contains key and params if exist
             */
            upload: function(url, onSuccess, onError, others) {
                var self = this;
                if (this.filePath) {
                    $cordovaFileTransfer.upload(
                        url,
                        self.filePath, {
                            fileKey: others.key || "image",
                            fileName: self.filePath.substr(self.filePath.lastIndexOf('/') + 1),
                            params: others.params
                        }
                    )
                        .then(function(result) { //on API call success
                            var response = null;
                            try {
                                response = JSON.parse(result.response);
                            } catch (e) {
                                response = result.response;
                            }
                            onSuccess.fire(response);

                        }, function(err) { // on error happens on API call
                            var e = null;
                            //check what error happens
                            switch (err.code) {

                                //if file (profile picture) is invalid
                                case FileTransferError.FILE_NOT_FOUND_ERR:
                                case FileTransferError.INVALID_URL_ERR:
                                    e = new Error("Invalid file, Please reselect profile picture");
                                    break;

                                    //if there is connection error
                                case FileTransferError.CONNECTION_ERR:
                                    e = new Error("Connection error, Please check your internet connection");
                                    break;

                                    //if user aborted profile picture upload
                                case FileTransferError.ABORT_ERR:
                                    e = new Error("User signup aborted");
                                    break;

                                    //if other error happened
                                default:
                                    e = new Error("Unknown error happened while connecting to server, please try again");
                                    break;
                            }

                            //handle error showing to user
                            if (onError) onError.fire(e);

                        }, function(progress) {});

                } else {
                    var http = new Http();
                    http.isLoading = false;
                    http.post({
                        url: url,
                        params: others.params,
                        onSuccess: onSuccess,
                        onFail: new Callback(function (e) {
                            onError.fire(e);
                        }),
                        onError: onError
                    });
                }

            },
            /**
             * plugin: https://github.com/liujinxing/cordova-plugin-thumbnail
             * generate a thumbnail for an image
             * @param  {Integer} width     of thumbnail
             * @param  {Integer} height    of thumbnail
             * @param  {Callback} onSuccess
             * @param  {Callback} onError
             */
            thumbnail: function(width, height, onSuccess, onError, others) {
                var options = {
                    uri: this.filePath,
                    folderName: others.folder || "Tmp",
                    quality: others.quality || 75,
                    width: width,
                    height: height
                };

                window.ImageResizer.resize(options,
                    function(image) {
                        onSuccess.fire(image);
                    }, function() {
                        onError.fire(new Error("Error happened while making image thumbnail"));
                    });
            }
        });

        return ImageManager;


    }
]);