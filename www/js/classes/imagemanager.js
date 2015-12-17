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
                        correctOrientation: true,
                        targetWidth: 720
                    };
                }

                
            },
            encoded: function() {

                this.cameraOptions.destinationType = Camera.DestinationType.DATA_URL;
                return this;
            },
            locationed: function() {

                this.cameraOptions.destinationType = Camera.DestinationType.FILE_URI;
                return this;
            },
            
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
            
            upload: function(url, onSuccess, onError, others) {
                var self = this;
                if (this.filePath) {
                    if (!others.params) others.params = {};
                    
                    

                    if (ionic.Platform.isAndroid())
                        url = url.replace("https", "http"); // fix server ssl cert. issue
                    
                    $cordovaFileTransfer.upload(
                        url,
                        self.filePath, {
                            fileKey: others.key || "image",
                            fileName: self.filePath.substr(self.filePath.lastIndexOf('/') + 1),
                            params: others.params
                        }, true
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
                        onFail: new Callback(function(e) {
                            onError.fire(e);
                        }),
                        onError: onError
                    });
                }

            },
            
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