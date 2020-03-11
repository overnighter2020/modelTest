/// <reference path="../three.d.ts" />
var Chameleon;
(function (Chameleon) {
    function mousePositionInCanvas(event, canvasBox) {
        return new THREE.Vector2(event.pageX - canvasBox.left, event.pageY - canvasBox.top);
    }
    Chameleon.mousePositionInCanvas = mousePositionInCanvas;
    function showCanvasInNewWindow(canvas) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }
    Chameleon.showCanvasInNewWindow = showCanvasInNewWindow;
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    Chameleon.getRandomInt = getRandomInt;
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    Chameleon.getRandomFloat = getRandomFloat;
    function angleBetween(point1, point2) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }
    Chameleon.angleBetween = angleBetween;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chameleon;
(function (Chameleon) {
    var mouseProjectionOnBall = (function () {
        var projGlobal = new THREE.Vector3(), projLocal = new THREE.Vector3();
        var upFactor = new THREE.Vector3(), eyeFactor = new THREE.Vector3(), sideFactor = new THREE.Vector3();
        return function (event, canvasBox, up, eye) {
            projLocal.set((event.pageX - canvasBox.width * 0.5 - canvasBox.left) / (canvasBox.width * .5), (canvasBox.height * 0.5 + canvasBox.top - event.pageY) / (canvasBox.height * .5), 0.0);
            var lengthSq = projLocal.lengthSq();
            if (lengthSq > 1.0) {
                projLocal.normalize();
            }
            else {
                projLocal.z = Math.sqrt(1.0 - lengthSq);
            }
            sideFactor.copy(up).cross(eye).setLength(projLocal.x);
            upFactor.copy(up).setLength(projLocal.y);
            eyeFactor.copy(eye).setLength(projLocal.z);
            return projGlobal.copy(sideFactor).add(upFactor).add(eyeFactor);
        };
    })();
    (function (CameraControlsState) {
        CameraControlsState[CameraControlsState["Idle"] = 0] = "Idle";
        CameraControlsState[CameraControlsState["Pan"] = 1] = "Pan";
        CameraControlsState[CameraControlsState["Rotate"] = 2] = "Rotate";
    })(Chameleon.CameraControlsState || (Chameleon.CameraControlsState = {}));
    var CameraControlsState = Chameleon.CameraControlsState;
    var CameraControlsBase = (function () {
        function CameraControlsBase(camera, canvasBox) {
            var _this = this;
            this.camera = camera;
            this.canvasBox = canvasBox;
            this.rotateSpeed = 1.5;
            this.panSpeed = 0.8;
            this.zoomSpeed = 1.2;
            this._state = 0 /* Idle */;
            this._eye = new THREE.Vector3();
            this.target = new THREE.Vector3();
            this._rotateStart = new THREE.Vector3();
            this._rotateEnd = new THREE.Vector3();
            this._zoomStart = 0;
            this._zoomEnd = 0;
            this._panStart = new THREE.Vector2();
            this._panEnd = new THREE.Vector2();
            this.rotateCamera = (function () {
                var axis = new THREE.Vector3(), quaternion = new THREE.Quaternion();
                return function () {
                    var angle = Math.acos(_this._rotateStart.dot(_this._rotateEnd) / _this._rotateStart.length() / _this._rotateEnd.length());
                    if (angle) {
                        axis.crossVectors(_this._rotateStart, _this._rotateEnd).normalize();
                        angle *= _this.rotateSpeed;
                        quaternion.setFromAxisAngle(axis, -angle);
                        _this._eye.applyQuaternion(quaternion);
                        _this.camera.up.applyQuaternion(quaternion);
                        _this._rotateEnd.applyQuaternion(quaternion);
                        _this._rotateStart.copy(_this._rotateEnd);
                    }
                };
            })();
            this.panCamera = (function () {
                var mouseChange = new THREE.Vector2(), cameraUp = new THREE.Vector3(), pan = new THREE.Vector3();
                return function () {
                    mouseChange.subVectors(_this._panEnd, _this._panStart);
                    if (mouseChange.lengthSq()) {
                        mouseChange.multiplyScalar(_this._eye.length() * _this.panSpeed);
                        pan.crossVectors(_this._eye, _this.camera.up).setLength(mouseChange.x).add(cameraUp.copy(_this.camera.up).setLength(mouseChange.y));
                        _this.camera.position.add(pan);
                        _this.target.add(pan);
                        _this._panStart.copy(_this._panEnd);
                    }
                };
            })();
            this.onMouseDown = function (event) {
                switch (event.button) {
                    case 0:
                        _this._state = 2 /* Rotate */;
                        _this._rotateStart.copy(_this._getMouseProjectionOnBall(event));
                        _this._rotateEnd.copy(_this._rotateStart);
                        break;
                    case 2:
                        _this._state = 1 /* Pan */;
                        _this._panStart.copy(_this._getMousePositionInCanvas(event));
                        _this._panEnd.copy(_this._panStart);
                        break;
                    default:
                        debugger;
                }
            };
            this.onMouseMove = function (event) {
                switch (_this._state) {
                    case 2 /* Rotate */:
                        _this._rotateEnd.copy(_this._getMouseProjectionOnBall(event));
                        break;
                    case 1 /* Pan */:
                        _this._panEnd.copy(_this._getMousePositionInCanvas(event));
                        break;
                    default:
                        debugger;
                }
            };
            this.onMouseUp = function (event) {
                _this._state = 0 /* Idle */;
            };
            this.onMouseWheel = function (event) {
                var delta = 0;
                if (event.wheelDelta) {
                    delta = -event.wheelDelta / 40;
                }
                else if (event.detail) {
                    delta = event.detail / 3;
                }
                _this._zoomStart += delta * 0.01;
            };
        }
        CameraControlsBase.prototype._getMousePositionInCanvas = function (event) {
            var pos = Chameleon.mousePositionInCanvas(event, this.canvasBox);
            pos.x /= this.canvasBox.width;
            pos.y /= this.canvasBox.height;
            return pos;
        };
        CameraControlsBase.prototype._getMouseProjectionOnBall = function (event) {
            return mouseProjectionOnBall(event, this.canvasBox, this.camera.up, this._eye);
        };
        CameraControlsBase.prototype.zoomCamera = function () {
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this.camera.zoom *= factor;
                this._zoomStart = this._zoomEnd;
                this.camera.updateProjectionMatrix();
            }
        };
        CameraControlsBase.prototype.updateCamera = function () {
            this._eye.subVectors(this.camera.position, this.target);
            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();
            this.camera.position.addVectors(this.target, this._eye);
            this.camera.lookAt(this.target);
        };
        return CameraControlsBase;
    })();
    Chameleon.CameraControlsBase = CameraControlsBase;
    /**
     * A simplification of THREE.TrackballControls from the three.js examples
     */
    var PerspectiveCameraControls = (function (_super) {
        __extends(PerspectiveCameraControls, _super);
        function PerspectiveCameraControls(camera, canvasBox) {
            _super.call(this, camera, canvasBox);
            this.camera = camera;
            this.canvasBox = canvasBox;
        }
        PerspectiveCameraControls.prototype.handleResize = function () {
            this.camera.aspect = this.canvasBox.width / this.canvasBox.height;
            this.camera.updateProjectionMatrix();
        };
        return PerspectiveCameraControls;
    })(CameraControlsBase);
    Chameleon.PerspectiveCameraControls = PerspectiveCameraControls;
    /**
     * A simplification of THREE.OrthographicTrackballControls from the three.js examples
     */
    var OrthographicCameraControls = (function (_super) {
        __extends(OrthographicCameraControls, _super);
        function OrthographicCameraControls(camera, canvasBox) {
            _super.call(this, camera, canvasBox);
            this.camera = camera;
            this.canvasBox = canvasBox;
            this._center0 = new THREE.Vector2((camera.left + camera.right) / 2, (camera.top + camera.bottom) / 2);
            this._viewSize = camera.top - camera.bottom;
            this.handleResize();
        }
        OrthographicCameraControls.prototype.handleResize = function () {
            this.camera.top = this._center0.y + this._viewSize / 2;
            this.camera.bottom = this._center0.y - this._viewSize / 2;
            var ratio = this.canvasBox.width / this.canvasBox.height;
            this.camera.left = this._center0.x - this._viewSize / 2 * ratio;
            this.camera.right = this._center0.x + this._viewSize / 2 * ratio;
            this.camera.updateProjectionMatrix();
        };
        return OrthographicCameraControls;
    })(CameraControlsBase);
    Chameleon.OrthographicCameraControls = OrthographicCameraControls;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
var Chameleon;
(function (Chameleon) {
    var EPSILON = 1e-3;
    function isPointInCircle(point, center, radius) {
        return Math.abs(radius) >= EPSILON && center.distanceToSquared(point) <= radius * radius;
    }
    function isPointInTriangle(point, t0, t1, t2) {
        //compute vectors & dot products
        var cx = point.x, cy = point.y, v0x = t2.x - t0.x, v0y = t2.y - t0.y, v1x = t1.x - t0.x, v1y = t1.y - t0.y, v2x = cx - t0.x, v2y = cy - t0.y, dot00 = v0x * v0x + v0y * v0y, dot01 = v0x * v1x + v0y * v1y, dot02 = v0x * v2x + v0y * v2y, dot11 = v1x * v1x + v1y * v1y, dot12 = v1x * v2x + v1y * v2y;
        // Compute barycentric coordinates
        var b = (dot00 * dot11 - dot01 * dot01), inv = Math.abs(b) < EPSILON ? 0 : (1 / b), u = (dot11 * dot02 - dot01 * dot12) * inv, v = (dot00 * dot12 - dot01 * dot02) * inv;
        return u >= 0 && v >= 0 && (u + v <= 1);
    }
    function lineOverlapsCircle(a, b, center, radius) {
        //check to see if start or end points lie within circle
        if (isPointInCircle(a, center, radius) || isPointInCircle(b, center, radius)) {
            return true;
        }
        var x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y, cx = center.x, cy = center.y;
        var c1x = cx - x1;
        var c1y = cy - y1;
        var e1x = x2 - x1;
        var e1y = y2 - y1;
        var k = c1x * e1x + c1y * e1y;
        if (k <= 0) {
            return false;
        }
        var len = Math.sqrt(e1x * e1x + e1y * e1y);
        k /= len;
        return k < len && c1x * c1x + c1y * c1y - k * k <= radius * radius;
    }
    function triangleCircleOverlaps(t1, t2, t3, center, radius) {
        return isPointInTriangle(center, t1, t2, t3) || lineOverlapsCircle(t1, t2, center, radius) || lineOverlapsCircle(t2, t3, center, radius) || lineOverlapsCircle(t3, t1, center, radius);
    }
    function lineSegmentsIntersect(v1, v2, v3, v4) {
        var a = v1.x, b = v1.y, c = v2.x, d = v2.y, p = v3.x, q = v3.y, r = v4.x, s = v4.y;
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (Math.abs(det) < EPSILON) {
            return false;
        }
        else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }
    function triangleRectangleOverlaps(t1, t2, t3, r1, r2, r3, r4) {
        return isPointInTriangle(r1, t1, t2, t3) || isPointInTriangle(r2, t1, t2, t3) || isPointInTriangle(r3, t1, t2, t3) || isPointInTriangle(r4, t1, t2, t3) || isPointInTriangle(t1, r1, r2, r3) || isPointInTriangle(t1, r2, r3, r4) || isPointInTriangle(t2, r1, r2, r3) || isPointInTriangle(t2, r2, r3, r4) || isPointInTriangle(t3, r1, r2, r3) || isPointInTriangle(t3, r2, r3, r4) || lineSegmentsIntersect(r1, r2, t1, t2) || lineSegmentsIntersect(r1, r2, t2, t3) || lineSegmentsIntersect(r1, r2, t3, t1) || lineSegmentsIntersect(r1, r3, t1, t2) || lineSegmentsIntersect(r1, r3, t2, t3) || lineSegmentsIntersect(r1, r3, t3, t1) || lineSegmentsIntersect(r2, r4, t1, t2) || lineSegmentsIntersect(r2, r4, t2, t3) || lineSegmentsIntersect(r2, r4, t3, t1) || lineSegmentsIntersect(r3, r4, t1, t2) || lineSegmentsIntersect(r3, r4, t2, t3) || lineSegmentsIntersect(r3, r4, t3, t1);
    }
    var AffectedFacesRecorder = (function () {
        function AffectedFacesRecorder(nFaces) {
            this._nAffectedFaces = 0;
            this._affectedFaces = new Uint32Array(nFaces);
            this._isFaceAffected = new Uint8Array(nFaces);
            this._isFaceAffectedEmpty = new Uint8Array(nFaces);
        }
        AffectedFacesRecorder.prototype.add = function (faceIndex) {
            if (!this._isFaceAffected[faceIndex]) {
                this._isFaceAffected[faceIndex] = 1;
                this._affectedFaces[this._nAffectedFaces] = faceIndex;
                this._nAffectedFaces += 1;
            }
        };
        AffectedFacesRecorder.prototype.reset = function () {
            this._nAffectedFaces = 0;
            this._isFaceAffected.set(this._isFaceAffectedEmpty);
        };
        AffectedFacesRecorder.prototype.forEach = function (f) {
            for (var i = 0; i < this._nAffectedFaces; i += 1) {
                f(this._affectedFaces[i]);
            }
        };
        Object.defineProperty(AffectedFacesRecorder.prototype, "length", {
            get: function () {
                return this._nAffectedFaces;
            },
            enumerable: true,
            configurable: true
        });
        AffectedFacesRecorder.prototype.contains = function (faceIndex) {
            return !!this._isFaceAffected[faceIndex];
        };
        return AffectedFacesRecorder;
    })();
    (function (TextureInUse) {
        TextureInUse[TextureInUse["Viewing"] = 0] = "Viewing";
        TextureInUse[TextureInUse["Drawing"] = 1] = "Drawing";
        TextureInUse[TextureInUse["Packed"] = 2] = "Packed";
    })(Chameleon.TextureInUse || (Chameleon.TextureInUse = {}));
    var TextureInUse = Chameleon.TextureInUse;
    /**
     * Manages the drawing, viewing, and packed textures
     */
    var TextureManager = (function () {
        // Assumption on geometry: material indices are same to face indices.
        // This special treatment is implemented in the constructor of Controls
        function TextureManager(mesh, renderer, camera) {
            this._prevStrokeCenter = new THREE.Vector2();
            this._preIndex = 0;
            this._backgroundSinglePixelCanvas = document.createElement('canvas');
            this.backgroundColor = '#FFFFFF';
            this._mesh = mesh;
            this._renderer = renderer;
            this._camera = camera;
            this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);
            this._initializeViewingTexture()._initializePackedTexture()._initializeDrawingTexture()._applyViewingTexture();
            this._textureInUse = 0 /* Viewing */;
            this._faceFloodFilledEmpty = new Uint8Array(this.geometry.faces.length);
            this._faceFloodFilled = new Uint8Array(this.geometry.faces.length);
            this._buildAdjacentFacesList();
        }
        Object.defineProperty(TextureManager.prototype, "drawingContext", {
            get: function () {
                return this._drawingCanvas.getContext('2d');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureManager.prototype, "drawingCanvas", {
            get: function () {
                return this._drawingCanvas;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureManager.prototype, "geometry", {
            get: function () {
                return this._mesh.geometry;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureManager.prototype, "packedTexture", {
            get: function () {
                return this._packedTextureCanvas;
            },
            enumerable: true,
            configurable: true
        });
        TextureManager.prototype.useViewingTexture = function () {
            if (this._textureInUse !== 0 /* Viewing */) {
                if (this._textureInUse === 1 /* Drawing */) {
                    this._updateViewingFromDrawingTexture();
                }
                this._applyViewingTexture();
                this._textureInUse = 0 /* Viewing */;
            }
            return this;
        };
        TextureManager.prototype.useDrawingTexture = function () {
            if (this._textureInUse !== 1 /* Drawing */) {
                this.useViewingTexture()._generateDrawingFromViewingTexture()._applyDrawingTexture();
                this._textureInUse = 1 /* Drawing */;
            }
            return this;
        };
        TextureManager.prototype.usePackedTexture = function () {
            if (this._textureInUse !== 2 /* Packed */) {
                this.useViewingTexture()._generatePackedFromViewingTexture()._applyPackedTexture();
                this._textureInUse = 2 /* Packed */;
            }
            return this;
        };
        TextureManager.prototype.backgroundReset = function () {
            this.useViewingTexture();
            var context = this._backgroundSinglePixelCanvas.getContext('2d');
            context.beginPath();
            context.fillStyle = this.backgroundColor;
            context.fillRect(0, 0, 1, 1);
            this._viewingBackgroundMaterial.map.needsUpdate = true;
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._viewingMaterial.materials[i] = this._viewingBackgroundMaterial;
                for (var j = 0; j < this._viewingTextureUvs[i].length; j += 1) {
                    this._viewingTextureUvs[i][j].set(0.5, 0.5);
                }
            }
        };
        TextureManager.prototype._initializeViewingTexture = function () {
            this._backgroundSinglePixelCanvas.width = this._backgroundSinglePixelCanvas.height = 1;
            var context = this._backgroundSinglePixelCanvas.getContext('2d');
            context.beginPath();
            context.fillStyle = this.backgroundColor;
            context.fillRect(0, 0, 1, 1);
            this._viewingTextureUvs = [];
            this._viewingMaterial = new THREE.MeshFaceMaterial();
            this._viewingBackgroundMaterial = new THREE.MeshLambertMaterial({
                map: new THREE.Texture(this._backgroundSinglePixelCanvas),
                transparent: true
            });
            this._viewingBackgroundMaterial.map.needsUpdate = true;
            var faces = this.geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                // Set the materialIndex to be the face index
                // TextureManager requires this special treatment to work
                faces[i].materialIndex = i;
                this._viewingTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);
                this._viewingMaterial.materials.push(this._viewingBackgroundMaterial);
            }
            return this;
        };
        // Depends on the initialization of viewing texture
        TextureManager.prototype._initializeDrawingTexture = function () {
            this._drawingVertexUvs = [];
            for (var i = 0; i < this.geometry.vertices.length; i += 1) {
                this._drawingVertexUvs.push(new THREE.Vector2());
            }
            this._drawingTextureUvs = [];
            var faces = this.geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                this._drawingTextureUvs.push([
                    new THREE.Vector2(),
                    new THREE.Vector2(),
                    new THREE.Vector2()
                ]);
            }
            this._drawingCanvas = document.createElement('canvas');
            this._drawingMaterial = new THREE.MeshLambertMaterial({
                map: new THREE.Texture(this._drawingCanvas),
                transparent: true
            });
            this._drawingTextureMesh = new THREE.Mesh(this.geometry, this._viewingMaterial);
            this._drawingTextureScene = new THREE.Scene();
            this._drawingTextureScene.add(new THREE.AmbientLight(0xFFFFFF));
            this._drawingTextureScene.add(this._drawingTextureMesh);
            return this;
        };
        TextureManager.prototype._initializePackedTexture = function () {
            this._packedTextureUvs = [];
            var faces = this.geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                this._packedTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);
            }
            this._packedTextureCanvas = document.createElement('canvas');
            this._packedTextureMaterial = new THREE.MeshLambertMaterial({
                map: new THREE.Texture(this._packedTextureCanvas)
            });
            return this;
        };
        TextureManager.prototype._updateViewingFromDrawingTexture = function () {
            var _this = this;
            if (this._affectedFaces.length > 0) {
                var uMax = Number.NEGATIVE_INFINITY, uMin = Number.POSITIVE_INFINITY, vMax = Number.NEGATIVE_INFINITY, vMin = Number.POSITIVE_INFINITY;
                this._affectedFaces.forEach(function (faceIndex) {
                    var drawingUvs = _this._drawingTextureUvs[faceIndex];
                    uMax = Math.max(uMax, drawingUvs[0].x, drawingUvs[1].x, drawingUvs[2].x);
                    uMin = Math.min(uMin, drawingUvs[0].x, drawingUvs[1].x, drawingUvs[2].x);
                    vMax = Math.max(vMax, drawingUvs[0].y, drawingUvs[1].y, drawingUvs[2].y);
                    vMin = Math.min(vMin, drawingUvs[0].y, drawingUvs[1].y, drawingUvs[2].y);
                });
                var xMax = uMax * this._drawingCanvas.width, xMin = uMin * this._drawingCanvas.width, yMax = (1 - vMin) * this._drawingCanvas.height, yMin = (1 - vMax) * this._drawingCanvas.height;
                this.drawingContext.rect(xMin, yMin, xMax, yMax);
                this.drawingContext.clip();
                var patchCanvas = document.createElement('canvas');
                patchCanvas.width = xMax - xMin;
                patchCanvas.height = yMax - yMin;
                patchCanvas.getContext('2d').drawImage(this._drawingCanvas, xMin, yMin, patchCanvas.width, patchCanvas.height, 0, 0, patchCanvas.width, patchCanvas.height);
                var patchMaterial = new THREE.MeshLambertMaterial({
                    map: new THREE.Texture(patchCanvas),
                    transparent: true
                });
                patchMaterial.map.needsUpdate = true;
                this._affectedFaces.forEach(function (faceIndex) {
                    _this._viewingMaterial.materials[faceIndex] = patchMaterial;
                    var drawingUvs = _this._drawingTextureUvs[faceIndex];
                    var viewingUvs = _this._viewingTextureUvs[faceIndex];
                    for (var j = 0; j < 3; j += 1) {
                        var drawingUV = drawingUvs[j];
                        viewingUvs[j].setX((drawingUV.x - uMin) * (_this._drawingCanvas.width) / patchCanvas.width).setY((drawingUV.y - vMin) * (_this._drawingCanvas.height) / patchCanvas.height);
                    }
                });
                this._affectedFaces.reset();
            }
            return this;
        };
        TextureManager.prototype._applyViewingTexture = function () {
            this._mesh.material = this._viewingMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype._generatePackedFromViewingTexture = function () {
            var patches = [];
            for (var faceIndex = 0; faceIndex < this.geometry.faces.length; faceIndex += 1) {
                var faceCanvas = this._viewingMaterial.materials[faceIndex].map.image;
                for (var patchIndex = 0; patchIndex < patches.length; patchIndex += 1) {
                    var patch = patches[patchIndex];
                    if (faceCanvas === patch.canvas) {
                        patch.faceIndices.push(faceIndex);
                        break;
                    }
                }
                if (patchIndex === patches.length) {
                    patches.push({
                        canvas: faceCanvas,
                        isRotated: false,
                        faceIndices: [faceIndex]
                    });
                }
            }
            var patchTotalArea = 0;
            for (var patchIndex = 0; patchIndex < patches.length; patchIndex += 1) {
                var patch = patches[patchIndex];
                patchTotalArea += patch.canvas.width * patch.canvas.height;
                if (patch.canvas.width > patch.canvas.height) {
                    var rotatedCanvas = document.createElement('canvas');
                    rotatedCanvas.width = patch.canvas.height;
                    rotatedCanvas.height = patch.canvas.width;
                    var rotatedCtx = rotatedCanvas.getContext("2d");
                    rotatedCtx.translate(rotatedCanvas.width, 0);
                    rotatedCtx.rotate(90 * Math.PI / 180);
                    rotatedCtx.drawImage(patch.canvas, 0, 0);
                    patch.canvas = rotatedCanvas;
                    patch.isRotated = true;
                }
            }
            // Sort patches by height
            patches.sort(function (l, r) { return r.canvas.height - l.canvas.height; });
            var packedTextureSideLength = Math.max(Math.floor(Math.sqrt(patchTotalArea) * 1.5), patches[0].canvas.height);
            // Prepare the one big canvas to hold all patches
            this._packedTextureCanvas.width = this._packedTextureCanvas.height = packedTextureSideLength;
            var packedTextureCtx = this._packedTextureCanvas.getContext("2d");
            // Finally iterate through each patch and put them on the packed texture, while updating UV values
            // Keep track of the current maximum y value (+1) for each column in the packed texture
            // The is used to implement the 'push upwards' operation described in Igarashi's paper
            var yBuffer = new Int32Array(packedTextureSideLength);
            var currPatchRow = 0, patchIndex = 0, remainingHeight = packedTextureSideLength;
            while (remainingHeight > 0 && patchIndex < patches.length) {
                remainingHeight -= patches[patchIndex].canvas.height;
                var remainingWidth = packedTextureSideLength;
                var isEvenRow = (currPatchRow % 2 == 0);
                while (remainingWidth > 0 && patchIndex < patches.length && patches[patchIndex].canvas.width <= remainingWidth) {
                    var currentPatch = patches[patchIndex];
                    // Draw the current patch on packed texture canvas
                    // Folding--pack left to right in even rows (starting from 0), right to left in odd rows
                    var x = isEvenRow ? packedTextureSideLength - remainingWidth : remainingWidth - currentPatch.canvas.width;
                    // 'Push each patch upward until it hits another patch to minimize the gap'
                    var y = yBuffer[x];
                    for (var i = x; i < (x + currentPatch.canvas.width); i += 1) {
                        y = Math.max(yBuffer[i], y);
                    }
                    packedTextureCtx.drawImage(currentPatch.canvas, x, y);
                    for (var i = x; i < (x + currentPatch.canvas.width); i += 1) {
                        yBuffer[i] = y + currentPatch.canvas.height;
                    }
                    for (var i = 0; i < currentPatch.faceIndices.length; i += 1) {
                        var faceIndex = currentPatch.faceIndices[i];
                        var packingUvs = this._packedTextureUvs[faceIndex];
                        var viewingUvs = this._viewingTextureUvs[faceIndex];
                        if (currentPatch.isRotated) {
                            for (var j = 0; j < 3; j += 1) {
                                packingUvs[j].setX((viewingUvs[j].y * currentPatch.canvas.width + x) / packedTextureSideLength).setY((packedTextureSideLength - y - viewingUvs[j].x * currentPatch.canvas.height) / packedTextureSideLength);
                            }
                        }
                        else {
                            for (var j = 0; j < 3; j += 1) {
                                packingUvs[j].setX((viewingUvs[j].x * currentPatch.canvas.width + x) / packedTextureSideLength).setY((packedTextureSideLength - y - (1 - viewingUvs[j].y) * currentPatch.canvas.height) / packedTextureSideLength);
                            }
                        }
                    }
                    remainingWidth -= currentPatch.canvas.width;
                    patchIndex += 1;
                }
                currPatchRow += 1;
            }
            this._packedTextureMaterial.map.needsUpdate = true;
            this.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype._applyPackedTexture = function () {
            this._mesh.material = this._packedTextureMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._packedTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype._generateDrawingFromViewingTexture = function () {
            console.assert(this._textureInUse === 0 /* Viewing */);
            // Assumption: when _renderer is created, 'alpha' must be set to true
            var originalClearAlpha = this._renderer.getClearAlpha();
            var originalClearColor = this._renderer.getClearColor().clone();
            this._renderer.setClearColor(0, 0);
            this._renderer.render(this._drawingTextureScene, this._camera);
            this._drawingCanvas.width = this._renderer.domElement.width;
            this._drawingCanvas.height = this._renderer.domElement.height;
            this.drawingContext.drawImage(this._renderer.domElement, -2, 0);
            this.drawingContext.drawImage(this._renderer.domElement, 2, 0);
            this.drawingContext.drawImage(this._renderer.domElement, 0, -2);
            this.drawingContext.drawImage(this._renderer.domElement, 0, 2);
            this.drawingContext.drawImage(this._renderer.domElement, 0, 0);
            this._drawingMaterial.map.needsUpdate = true;
            var projectedPosition = new THREE.Vector3();
            for (var i = 0; i < this.geometry.vertices.length; i += 1) {
                projectedPosition.copy(this.geometry.vertices[i]).project(this._camera);
                this._drawingVertexUvs[i].setX((projectedPosition.x + 1) / 2).setY((projectedPosition.y + 1) / 2);
            }
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._drawingTextureUvs[i][0].copy(this._drawingVertexUvs[this.geometry.faces[i].a]);
                this._drawingTextureUvs[i][1].copy(this._drawingVertexUvs[this.geometry.faces[i].b]);
                this._drawingTextureUvs[i][2].copy(this._drawingVertexUvs[this.geometry.faces[i].c]);
            }
            this._renderer.setClearColor(originalClearColor, originalClearAlpha);
            return this;
        };
        TextureManager.prototype._applyDrawingTexture = function () {
            this._mesh.material = this._drawingMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype._castRayFromMouse = function (canvasPos) {
            var mouse3d = new THREE.Vector3(canvasPos.x / this._drawingCanvas.width * 2 - 1, -canvasPos.y / this._drawingCanvas.height * 2 + 1, -1.0);
            var direction = new THREE.Vector3(mouse3d.x, mouse3d.y, 1.0);
            mouse3d.unproject(this._camera);
            direction.unproject(this._camera).sub(mouse3d).normalize();
            return new THREE.Raycaster(mouse3d, direction).intersectObject(this._drawingTextureMesh);
        };
        TextureManager.prototype._isFaceAffectedByStroke = function (faceIndex, strokeCenter, strokeRadius, strokeStarts) {
            var t1 = new THREE.Vector2().copy(this._drawingTextureUvs[faceIndex][0]);
            t1.x = t1.x * this._drawingCanvas.width;
            t1.y = (1 - t1.y) * this._drawingCanvas.height;
            var t2 = new THREE.Vector2().copy(this._drawingTextureUvs[faceIndex][1]);
            t2.x = t2.x * this._drawingCanvas.width;
            t2.y = (1 - t2.y) * this._drawingCanvas.height;
            var t3 = new THREE.Vector2().copy(this._drawingTextureUvs[faceIndex][2]);
            t3.x = t3.x * this._drawingCanvas.width;
            t3.y = (1 - t3.y) * this._drawingCanvas.height;
            if (triangleCircleOverlaps(t1, t2, t3, strokeCenter, strokeRadius)) {
                return true;
            }
            if (strokeStarts) {
                return false;
            }
            var centerDiff = new THREE.Vector2(strokeCenter.y - this._prevStrokeCenter.y, this._prevStrokeCenter.x - strokeCenter.x);
            if (centerDiff.lengthSq() < EPSILON) {
                return false;
            }
            centerDiff.normalize().multiplyScalar(strokeRadius);
            var r1 = new THREE.Vector2().copy(this._prevStrokeCenter).add(centerDiff);
            var r2 = new THREE.Vector2().copy(this._prevStrokeCenter).sub(centerDiff);
            var r3 = new THREE.Vector2().copy(strokeCenter).add(centerDiff);
            var r4 = new THREE.Vector2().copy(strokeCenter).sub(centerDiff);
            return triangleRectangleOverlaps(t1, t2, t3, r1, r2, r3, r4);
        };
        TextureManager.prototype._recordAffectedFaces = function (faceIndex, strokeCenter, strokeRadius, strokeStarts) {
            if (faceIndex >= 0 && !this._faceFloodFilled[faceIndex] && this._isFaceAffectedByStroke(faceIndex, strokeCenter, strokeRadius, strokeStarts)) {
                this._faceFloodFilled[faceIndex] = 1;
                this._affectedFaces.add(faceIndex);
                for (var i = 0; i < this._nAdjacentFaces[faceIndex]; i += 1) {
                    var newFaceIndex = this._adjacentFacesList[faceIndex][i];
                    var cameraDirection = new THREE.Vector3().copy(this._camera.position).normalize();
                    if (this.geometry.faces[newFaceIndex].normal.dot(cameraDirection) > 0) {
                        this._recordAffectedFaces(newFaceIndex, strokeCenter, strokeRadius, strokeStarts);
                    }
                }
            }
        };
        TextureManager.prototype.onStrokePainted = function (canvasPos, radius, strokeStarts) {
            var intersections = this._castRayFromMouse(canvasPos);
            if (intersections.length > 0) {
                this._drawingMaterial.map.needsUpdate = true;
                var faceIndex = intersections[0].face.materialIndex;
                this._faceFloodFilled.set(this._faceFloodFilledEmpty);
                this._recordAffectedFaces(faceIndex, canvasPos, radius, strokeStarts);
                if (!strokeStarts) {
                    this._recordAffectedFaces(this._preIndex, canvasPos, radius, strokeStarts);
                }
                this._prevStrokeCenter.copy(canvasPos);
                this._preIndex = faceIndex;
            }
            return this;
        };
        TextureManager.prototype._buildAdjacentFacesList = function () {
            this._nAdjacentFaces = new Uint8Array(this.geometry.faces.length);
            this._adjacentFacesList = new Array(this.geometry.faces.length);
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._adjacentFacesList[i] = new Uint32Array(10);
            }
            for (var i = 0; i < this.geometry.faces.length - 1; i += 1) {
                for (var j = i + 1; j < this.geometry.faces.length; j += 1) {
                    var vi = [this.geometry.faces[i].a, this.geometry.faces[i].b, this.geometry.faces[i].c];
                    var vj = [this.geometry.faces[j].a, this.geometry.faces[j].b, this.geometry.faces[j].c];
                    var count = 0;
                    for (var k = 0; k < 3; k++)
                        for (var l = 0; l < 3; l++)
                            if (this.geometry.vertices[vi[k]].x - this.geometry.vertices[vj[l]].x < EPSILON && this.geometry.vertices[vi[k]].x - this.geometry.vertices[vj[l]].x > -EPSILON && this.geometry.vertices[vi[k]].y - this.geometry.vertices[vj[l]].y < EPSILON && this.geometry.vertices[vi[k]].y - this.geometry.vertices[vj[l]].y > -EPSILON && this.geometry.vertices[vi[k]].z - this.geometry.vertices[vj[l]].z < EPSILON && this.geometry.vertices[vi[k]].z - this.geometry.vertices[vj[l]].z > -EPSILON && this.geometry.faces[i].normal.dot(this.geometry.faces[j].normal) > EPSILON)
                                count++;
                    if (count == 2) {
                        this._adjacentFacesList[i][this._nAdjacentFaces[i]] = j;
                        this._adjacentFacesList[j][this._nAdjacentFaces[j]] = i;
                        this._nAdjacentFaces[i] += 1;
                        this._nAdjacentFaces[j] += 1;
                    }
                }
            }
        };
        return TextureManager;
    })();
    Chameleon.TextureManager = TextureManager;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
var Chameleon;
(function (Chameleon) {
    var Pencil = (function () {
        function Pencil() {
            this._canvasContext = null;
        }
        Object.defineProperty(Pencil.prototype, "radius", {
            get: function () {
                return 1;
            },
            enumerable: true,
            configurable: true
        });
        Pencil.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius * 2;
            this._canvasContext.moveTo(position.x, position.y);
        };
        Pencil.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        Pencil.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil;
    })();
    Chameleon.Pencil = Pencil;
    var MarkerBrush = (function () {
        function MarkerBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
        }
        MarkerBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius * 2;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.moveTo(position.x, position.y);
        };
        MarkerBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        MarkerBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return MarkerBrush;
    })();
    Chameleon.MarkerBrush = MarkerBrush;
    var BlurryMarkerBrush = (function () {
        function BlurryMarkerBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
        }
        BlurryMarkerBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.shadowBlur = this.radius;
            this._canvasContext.shadowColor = this.color;
            this._canvasContext.moveTo(position.x, position.y);
        };
        BlurryMarkerBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        BlurryMarkerBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return BlurryMarkerBrush;
    })();
    Chameleon.BlurryMarkerBrush = BlurryMarkerBrush;
    var CalligraphyBrush = (function () {
        function CalligraphyBrush() {
            this.img = new Image();
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        Object.defineProperty(CalligraphyBrush.prototype, "radius", {
            get: function () {
                return 32 / 2;
            },
            enumerable: true,
            configurable: true
        });
        CalligraphyBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        };
        CalligraphyBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                var dist = this._lastPosition.distanceTo(position);
                var angle = Chameleon.angleBetween(this._lastPosition, position);
                for (var i = 0; i < dist; i++) {
                    var x = this._lastPosition.x + (Math.sin(angle) * i) - this.radius;
                    var y = this._lastPosition.y + (Math.cos(angle) * i) - this.radius;
                    this._canvasContext.drawImage(this.img, x, y);
                }
                this._lastPosition.copy(position);
            }
        };
        CalligraphyBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return CalligraphyBrush;
    })();
    Chameleon.CalligraphyBrush = CalligraphyBrush;
    var Fur = (function () {
        function Fur() {
            this.img = new Image();
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        Object.defineProperty(Fur.prototype, "radius", {
            get: function () {
                return 32 * 1.415 / 2;
            },
            enumerable: true,
            configurable: true
        });
        Fur.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this.img.width = 10;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        };
        Fur.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                var dist = this._lastPosition.distanceTo(position);
                var angle = Chameleon.angleBetween(this._lastPosition, position);
                for (var i = 0; i < dist; i++) {
                    var x = this._lastPosition.x + (Math.sin(angle) * i);
                    var y = this._lastPosition.y + (Math.cos(angle) * i);
                    this._canvasContext.save();
                    this._canvasContext.translate(x, y);
                    this._canvasContext.scale(0.5, 0.5);
                    this._canvasContext.rotate(Math.PI * 180 / Chameleon.getRandomInt(0, 180));
                    this._canvasContext.drawImage(this.img, 0, 0);
                    this._canvasContext.restore();
                }
                this._lastPosition.copy(position);
            }
        };
        Fur.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Fur;
    })();
    Chameleon.Fur = Fur;
    var ThickBrush = (function () {
        function ThickBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        ThickBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius / 10;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        };
        ThickBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.beginPath();
                this._canvasContext.globalAlpha = 0.85;
                for (var i = -this.radius * 0.9; i <= this.radius * 0.9; i += this.radius / 20) {
                    this._canvasContext.beginPath();
                    this._canvasContext.moveTo(this._lastPosition.x + i, this._lastPosition.y + i);
                    this._canvasContext.lineTo(position.x + i, position.y + i);
                    this._canvasContext.stroke();
                }
                this._lastPosition.copy(position);
            }
        };
        ThickBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return ThickBrush;
    })();
    Chameleon.ThickBrush = ThickBrush;
    var InkDropBrush = (function () {
        function InkDropBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        InkDropBrush.prototype.drawDrop = function (position) {
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = Math.random();
            this._canvasContext.arc(position.x, position.y, Chameleon.getRandomInt(this.radius / 3, this.radius), 30, 270, false);
            this._canvasContext.fill();
        };
        InkDropBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.fillStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
            this.drawDrop(position);
        };
        InkDropBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext && position.distanceTo(this._lastPosition) > this.radius * 2 / 3) {
                this._lastPosition.copy(position);
                this.drawDrop(position);
            }
        };
        InkDropBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return InkDropBrush;
    })();
    Chameleon.InkDropBrush = InkDropBrush;
    var StarBrush = (function () {
        function StarBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        StarBrush.prototype.drawStar = function (position, angle) {
            var length = this.radius / 2;
            var x = position.x, y = position.y;
            this._canvasContext.save();
            this._canvasContext.translate(x, y);
            this._canvasContext.beginPath();
            this._canvasContext.rotate(Math.PI / 180 * angle);
            for (var i = 5; i--;) {
                this._canvasContext.lineTo(0, length);
                this._canvasContext.translate(0, length);
                this._canvasContext.rotate((Math.PI * 2 / 10));
                this._canvasContext.lineTo(0, -length);
                this._canvasContext.translate(0, -length);
                this._canvasContext.rotate(-(Math.PI * 6 / 10));
            }
            this._canvasContext.lineTo(0, length);
            this._canvasContext.closePath();
            this._canvasContext.stroke();
            this._canvasContext.restore();
        };
        StarBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.drawStar(position, Chameleon.getRandomInt(0, 180));
            this._lastPosition.copy(position);
        };
        StarBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext && this._lastPosition.distanceTo(position) > this.radius) {
                this.drawStar(position, Chameleon.getRandomInt(0, 180));
                this._lastPosition.copy(position);
            }
        };
        StarBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return StarBrush;
    })();
    Chameleon.StarBrush = StarBrush;
    var RandomStarBrush = (function () {
        function RandomStarBrush(radius) {
            this.radius = radius;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        RandomStarBrush.prototype.drawStar = function (position) {
            var angle = Chameleon.getRandomInt(0, 180), width = Chameleon.getRandomInt(1, this.radius / 2.8), opacity = Math.random(), scale = Chameleon.getRandomInt(10, 20) / 20, color = ('rgb(' + Chameleon.getRandomInt(0, 255) + ',' + Chameleon.getRandomInt(0, 255) + ',' + Chameleon.getRandomInt(0, 255) + ')'), length = this.radius / 3.5;
            this._canvasContext.save();
            this._canvasContext.translate(position.x, position.y);
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = opacity;
            this._canvasContext.rotate(Math.PI / 180 * angle);
            this._canvasContext.scale(scale, scale);
            this._canvasContext.strokeStyle = color;
            this._canvasContext.lineWidth = width;
            for (var i = 5; i--;) {
                this._canvasContext.lineTo(0, length);
                this._canvasContext.translate(0, length);
                this._canvasContext.rotate((Math.PI * 2 / 10));
                this._canvasContext.lineTo(0, -length);
                this._canvasContext.translate(0, -length);
                this._canvasContext.rotate(-(Math.PI * 6 / 10));
            }
            this._canvasContext.lineTo(0, length);
            this._canvasContext.closePath();
            this._canvasContext.stroke();
            this._canvasContext.restore();
        };
        RandomStarBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._lastPosition.copy(position);
            this.drawStar(position);
        };
        RandomStarBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext && position.distanceTo(this._lastPosition) > this.radius * 2 / 3) {
                this._lastPosition.copy(position);
                this.drawStar(position);
            }
        };
        RandomStarBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return RandomStarBrush;
    })();
    Chameleon.RandomStarBrush = RandomStarBrush;
    var SprayBrush = (function () {
        function SprayBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._density = 70;
        }
        SprayBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.fillStyle = this.color;
        };
        SprayBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                for (var i = this._density; i--;) {
                    var dotRadius = Chameleon.getRandomFloat(0, this.radius);
                    var angle = Chameleon.getRandomFloat(0, Math.PI * 2);
                    var dotWidth = Chameleon.getRandomFloat(1, 2);
                    this._canvasContext.globalAlpha = Math.random();
                    this._canvasContext.fillRect(position.x + dotRadius * Math.cos(angle), position.y + dotRadius * Math.sin(angle), dotWidth, dotWidth);
                }
            }
        };
        SprayBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return SprayBrush;
    })();
    Chameleon.SprayBrush = SprayBrush;
    var TextureBrush = (function () {
        function TextureBrush(radius, texture) {
            this.radius = radius;
            this.texture = texture;
            this._canvasContext = null;
        }
        TextureBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius * 2;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.strokeStyle = this._canvasContext.createPattern(this.texture, 'repeat');
            this._canvasContext.moveTo(position.x, position.y);
        };
        TextureBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.moveTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        TextureBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.moveTo(0, 0);
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return TextureBrush;
    })();
    Chameleon.TextureBrush = TextureBrush;
})(Chameleon || (Chameleon = {}));
/// <reference path="../jszip.d.ts" />
/// <reference path="../three-objloaderexporter.d.ts" />
/// <reference path="./common.ts" />
/// <reference path="./camera-controls.ts" />
/// <reference path="./texture-manager.ts" />
/// <reference path="./brushes.ts" />
var Chameleon;
(function (Chameleon) {
    var ControlsState;
    (function (ControlsState) {
        ControlsState[ControlsState["Idle"] = 0] = "Idle";
        ControlsState[ControlsState["Draw"] = 1] = "Draw";
        ControlsState[ControlsState["View"] = 2] = "View";
    })(ControlsState || (ControlsState = {}));
    var Controls = (function () {
        function Controls(geometry, canvas) {
            var _this = this;
            this._state = 0 /* Idle */;
            this._mesh = new THREE.Mesh();
            this.canvasBox = { left: 0, top: 0, width: 0, height: 0 };
            this._headLight = new THREE.PointLight(0xFFFFFF, 0.25);
            this._perspectiveView = false;
            this._scene = (function () {
                var scene = new THREE.Scene();
                var ambientLight = new THREE.AmbientLight(0x999999);
                scene.add(ambientLight);
                var light = new THREE.DirectionalLight(0xFFFFFF, 0.2);
                light.position.set(320, 390, 700);
                scene.add(light);
                var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.2);
                light2.position.set(-720, -190, -300);
                scene.add(light2);
                scene.add(_this._headLight);
                scene.add(_this._mesh);
                return scene;
            })();
            this._renderer = (function () {
                var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                renderer.setClearColor(0xAAAAAA, 1.0);
                return renderer;
            })();
            this.brush = new Chameleon.Pencil();
            this._mousedown = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state !== 0 /* Idle */) {
                    return;
                }
                // Hold shift key to rotate and pan
                if (_this.perspectiveView || event.shiftKey) {
                    _this._state = 2 /* View */;
                    _this._textureManager.useViewingTexture();
                    _this._perspectiveCameraControls.onMouseDown(event);
                    _this._orthographicCameraControls.onMouseDown(event);
                }
                else {
                    _this._state = 1 /* Draw */;
                    _this._textureManager.useDrawingTexture();
                    var pos = Chameleon.mousePositionInCanvas(event, _this.canvasBox);
                    _this.brush.startStroke(_this._textureManager.drawingCanvas, pos);
                    _this._textureManager.onStrokePainted(pos, _this.brush.radius, true);
                }
                document.addEventListener('mousemove', _this._mousemove, false);
                document.addEventListener('mouseup', _this._mouseup, false);
            };
            this._mousemove = function (event) {
                if (_this._state === 0 /* Idle */) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                switch (_this._state) {
                    case 2 /* View */:
                        _this._perspectiveCameraControls.onMouseMove(event);
                        _this._orthographicCameraControls.onMouseMove(event);
                        break;
                    case 1 /* Draw */:
                        var pos = Chameleon.mousePositionInCanvas(event, _this.canvasBox);
                        _this.brush.continueStoke(pos);
                        _this._textureManager.onStrokePainted(pos, _this.brush.radius, false);
                        break;
                    default:
                        debugger;
                }
            };
            this._mouseup = function (event) {
                event.preventDefault();
                event.stopPropagation();
                _this.brush.finishStroke();
                _this.update();
                _this._perspectiveCameraControls.onMouseUp(event);
                _this._orthographicCameraControls.onMouseUp(event);
                _this._state = 0 /* Idle */;
                document.removeEventListener('mousemove', _this._mousemove);
                document.removeEventListener('mouseup', _this._mouseup);
            };
            this._mousewheel = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state === 1 /* Draw */ || !_this.perspectiveView && !event.shiftKey) {
                    return;
                }
                _this._textureManager.useViewingTexture();
                _this._perspectiveCameraControls.onMouseWheel(event);
                _this._orthographicCameraControls.onMouseWheel(event);
            };
            this.geometry = geometry.clone();
            // Note that a crucial assumption is that this Mesh object will never be transformed (rotated, scaled, or translated)
            // This is crucial for both TextureManager and CameraControls to work properly
            this._mesh.geometry = this.geometry;
            if (!canvas) {
                canvas = document.createElement('canvas');
            }
            this.canvas = canvas;
            this.canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
            this.canvas.addEventListener('mousedown', this._mousedown, false);
            this.canvas.addEventListener('mousewheel', this._mousewheel, false);
            this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
            this._initializeCamera();
            this._textureManager = new Chameleon.TextureManager(this._mesh, this._renderer, this._orthographicCamera);
            this.handleResize();
            this.update();
        }
        Controls.prototype.updateCanvasBox = function () {
            var canvasRect = this.canvas.getBoundingClientRect();
            var docElement = this.canvas.ownerDocument.documentElement;
            this.canvasBox.left = canvasRect.left + window.pageXOffset - docElement.clientLeft;
            this.canvasBox.top = canvasRect.top + window.pageYOffset - docElement.clientTop;
            this.canvasBox.width = canvasRect.width;
            this.canvasBox.height = canvasRect.height;
        };
        Object.defineProperty(Controls.prototype, "perspectiveView", {
            get: function () {
                return this._perspectiveView;
            },
            set: function (value) {
                if (this._perspectiveView === value) {
                    return;
                }
                this._perspectiveView = value;
                if (value) {
                    this._textureManager.useViewingTexture();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Controls.prototype, "backgroundColor", {
            get: function () {
                return this._textureManager.backgroundColor;
            },
            set: function (value) {
                this._textureManager.backgroundColor = value;
                this._textureManager.backgroundReset();
            },
            enumerable: true,
            configurable: true
        });
        Controls.prototype.handleResize = function () {
            var devicePixelRatio = window.devicePixelRatio || 1; // Evaluates to 2 if Retina
            this._renderer.setSize(this.canvas.width / devicePixelRatio, this.canvas.height / devicePixelRatio);
            this.updateCanvasBox();
            this._orthographicCameraControls.handleResize();
            this._perspectiveCameraControls.handleResize();
            this._textureManager.useViewingTexture();
        };
        Controls.prototype.update = function () {
            this._perspectiveCameraControls.updateCamera();
            this._orthographicCameraControls.updateCamera();
            if (this.perspectiveView) {
                this._headLight.position.copy(this._perspectiveCamera.position);
                this._renderer.render(this._scene, this._perspectiveCamera);
            }
            else {
                this._headLight.position.copy(this._orthographicCamera.position);
                this._renderer.render(this._scene, this._orthographicCamera);
            }
            this.canvas.getContext('2d').drawImage(this._renderer.domElement, 0, 0);
        };
        Controls._computeBoundingBallRadius = function (geometry) {
            var radius = 0;
            var origin = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < geometry.vertices.length; i += 1) {
                radius = Math.max(radius, geometry.vertices[i].distanceTo(origin));
            }
            return radius;
        };
        Controls.prototype._initializeCamera = function () {
            this._boundingBallRadius = Controls._computeBoundingBallRadius(this.geometry);
            var fov = 60;
            var z = 2 * this._boundingBallRadius / Math.tan(fov / 2 / 180 * Math.PI);
            this._orthographicCamera = new THREE.OrthographicCamera(-this._boundingBallRadius * 2, this._boundingBallRadius * 2, this._boundingBallRadius * 2, -this._boundingBallRadius * 2);
            this._orthographicCamera.position.z = z;
            this._orthographicCameraControls = new Chameleon.OrthographicCameraControls(this._orthographicCamera, this.canvasBox);
            this._perspectiveCamera = new THREE.PerspectiveCamera(fov, 1);
            this._perspectiveCamera.position.setZ(z);
            this._perspectiveCameraControls = new Chameleon.PerspectiveCameraControls(this._perspectiveCamera, this.canvasBox);
        };
        Controls.prototype.resetCameras = function () {
            var fov = 60;
            var z = 2 * this._boundingBallRadius / Math.tan(fov / 2 / 180 * Math.PI);
            this._orthographicCamera.position.set(0, 0, z);
            this._perspectiveCamera.position.set(0, 0, z);
            var origin = new THREE.Vector3(0, 0, 0);
            this._orthographicCameraControls.target.copy(origin);
            this._orthographicCamera.lookAt(origin);
            this._perspectiveCameraControls.target.copy(origin);
            this._perspectiveCamera.lookAt(origin);
            this._orthographicCamera.up.set(0, 1, 0);
            this._perspectiveCamera.up.set(0, 1, 0);
            this._orthographicCamera.zoom = 1;
            this._perspectiveCamera.zoom = 1;
            this._orthographicCamera.updateProjectionMatrix();
            this._perspectiveCamera.updateProjectionMatrix();
            this._orthographicCameraControls.handleResize();
            this._perspectiveCameraControls.handleResize();
            this._textureManager.useViewingTexture();
        };
        Controls.prototype.packTexture = function () {
            this._textureManager.usePackedTexture();
            var zip = new JSZip();
            var textureDataUrl = this._textureManager.packedTexture.toDataURL();
            zip.file('texture.png', textureDataUrl.substr(textureDataUrl.indexOf(',') + 1), { base64: true });
            var objData = new THREE.OBJExporter().parse(this.geometry);
            zip.file('model.obj', objData);
            return zip.generate({ type: 'blob' });
        };
        Controls.prototype.removeEventListeners = function () {
            document.removeEventListener('mousedown', this._mousedown);
            document.removeEventListener('mousewheel', this._mousewheel);
            document.removeEventListener('DOMMouseScroll', this._mousewheel);
            document.removeEventListener('mousemove', this._mousemove);
            document.removeEventListener('mouseup', this._mouseup);
        };
        return Controls;
    })();
    Chameleon.Controls = Controls;
})(Chameleon || (Chameleon = {}));
/// <reference path="./chameleon/controls.ts" />
/// <reference path="./chameleon/brushes.ts" />
var Chameleon;
(function (Chameleon) {
    function create(geometry, canvas) {
        return new Chameleon.Controls(geometry, canvas);
    }
    Chameleon.create = create;
})(Chameleon || (Chameleon = {}));
/// <reference path="./three.d.ts" />
/// <reference path="./three-objloaderexporter.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />
(function () {
    var chameleon;
    var screenCanvas = document.createElement('canvas');
    document.body.appendChild(screenCanvas);
    var onresize = function () {
        screenCanvas.height = window.innerHeight;
        screenCanvas.width = window.innerWidth;
        if (chameleon) {
            chameleon.handleResize();
        }
    };
    onresize();
    window.addEventListener('resize', onresize, false);
    function setUpBrushSettingsGui(settings, folder) {
        settings.brush = {
            type: null,
            size: 15,
            color: '#00d3e1',
            texture: null
        };
        var loadTexture = function (path) {
            var textureSideLength = 512;
            var canvas = document.createElement('canvas');
            canvas.height = canvas.width = textureSideLength;
            var image = new Image();
            image.src = path;
            image.onload = function () {
                canvas.getContext('2d').drawImage(image, 0, 0);
            };
            return canvas;
        };
        var brushItems = [
            {
                name: 'Marker',
                instance: new Chameleon.MarkerBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Blurry Marker',
                instance: new Chameleon.BlurryMarkerBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Calligraphy',
                instance: new Chameleon.CalligraphyBrush()
            },
            {
                name: 'Fur',
                instance: new Chameleon.Fur()
            },
            {
                name: 'Thick Brush',
                instance: new Chameleon.ThickBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Ink Drop',
                instance: new Chameleon.InkDropBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Star',
                instance: new Chameleon.StarBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Random Star',
                instance: new Chameleon.RandomStarBrush(1),
                sizeConfig: true
            },
            {
                name: 'Spray',
                instance: new Chameleon.SprayBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Texture',
                instance: new Chameleon.TextureBrush(1, textureItems[0].canvas),
                sizeConfig: true,
                textureConfig: true
            }
        ];
        var typeController = folder.add(settings.brush, 'type', brushItems.map(function (_) { return _.name; })).name('Type');
        var sizeController = folder.add(settings.brush, 'size', 1, 40).step(0.5).name('Size');
        var colorController = folder.addColor(settings.brush, 'color').name('Color');
        var textureController = folder.add(settings.brush, 'texture', textureItems.map(function (_) { return _.name; })).name('Texture');
        var handleSizeChange = function (newSize) {
            if (chameleon) {
                chameleon.brush.radius = newSize / 2;
            }
        };
        var handleColorChange = function (newColor) {
            if (chameleon && ('color' in chameleon.brush)) {
                chameleon.brush.color = newColor;
            }
        };
        var handleTextureChange = function (newTexture) {
            if (!chameleon || !('texture' in chameleon.brush)) {
                return;
            }
            for (var i = 0; i < textureItems.length; i += 1) {
                if (textureItems[i].name === newTexture) {
                    chameleon.brush.texture = textureItems[i].canvas;
                    return;
                }
            }
        };
        var handleTypeChange = function (newType) {
            if (!chameleon) {
                return;
            }
            for (var i = 0; i < brushItems.length; i += 1) {
                if (brushItems[i].name === newType) {
                    chameleon.brush = brushItems[i].instance;
                    handleSizeChange(settings.brush.size);
                    handleColorChange(settings.brush.color);
                    handleTextureChange(settings.brush.texture);
                    sizeController.domElement.style.visibility = (brushItems[i].sizeConfig) ? 'visible' : 'collapse';
                    colorController.domElement.style.visibility = (brushItems[i].colorConfig) ? 'visible' : 'collapse';
                    textureController.domElement.style.visibility = (brushItems[i].textureConfig) ? 'visible' : 'collapse';
                    return;
                }
            }
        };
        typeController.onChange(handleTypeChange);
        sizeController.onChange(handleSizeChange);
        colorController.onChange(handleColorChange);
        textureController.onChange(handleTextureChange);
        settings.brush.type = brushItems[0].name;
        return function () {
            handleTypeChange(settings.brush.type);
        };
    }
    function setUpGui() {
        var settings = {
            backgroundColor: '#FFFFFF',
            camera: {
                reset: function () {
                    if (chameleon) {
                        chameleon.resetCameras();
                    }
                },
                perspectiveView: false
            },
            exportObjTexture: function () {
                if (chameleon) {
                    saveAs(chameleon.packTexture(), 'texture-export.zip');
                }
            },
            openHelp: function () {
                window.open('https://github.com/tomtung/chameleon.js#usage');
            }
        };
        var gui = new dat.GUI({ width: 350 });
        var handleBackgroundReset = function (color) {
            if (chameleon) {
                chameleon.backgroundColor = color;
            }
        };
        gui.addColor(settings, 'backgroundColor').name('Background Reset').onChange(handleBackgroundReset);
        var cameraFolder = gui.addFolder('Camera');
        var brushFolder = gui.addFolder('Brush');
        cameraFolder.open();
        var handlePerspectiveView = function (perspectiveVIew) {
            if (chameleon) {
                chameleon.perspectiveView = perspectiveVIew;
            }
            if (perspectiveVIew) {
                brushFolder.close();
            }
            else {
                brushFolder.open();
            }
        };
        cameraFolder.add(settings.camera, 'perspectiveView').name('Perspective Viewing').onChange(handlePerspectiveView);
        cameraFolder.add(settings.camera, 'reset').name('Reset');
        brushFolder.open();
        var reapplyBrushGuiSettings = setUpBrushSettingsGui(settings, brushFolder);
        gui.add(settings, 'exportObjTexture').name('Export Textured Model');
        gui.add(settings, 'openHelp').name('Help');
        return function () {
            handleBackgroundReset(settings.backgroundColor);
            handlePerspectiveView(settings.camera.perspectiveView);
            reapplyBrushGuiSettings();
        };
    }
    var reapplyGuiSettings = setUpGui();
    function loadGeometry(geometry) {
        if (chameleon) {
            chameleon.removeEventListeners();
        }
        chameleon = Chameleon.create(geometry, screenCanvas);
        reapplyGuiSettings();
        console.log('New Model Loaded.');
    }
    function object3dToGeometry(object3d) {
        var geometry = new THREE.Geometry();
        object3d.traverse(function (child) {
            if ((child instanceof THREE.Mesh) && !(child.parent instanceof THREE.Mesh)) {
                var mesh = child;
                if (mesh.geometry instanceof THREE.BufferGeometry) {
                    mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
                    mesh.geometry.faceVertexUvs = [[]];
                    mesh.geometry.uvsNeedUpdate = true;
                }
                THREE.GeometryUtils.merge(geometry, mesh);
            }
        });
        return geometry;
    }
    var objLoader = new THREE.OBJLoader();
    screenCanvas.ondragover = function () { return false; };
    screenCanvas.ondrop = function (e) {
        e.preventDefault();
        var file = e.dataTransfer.files[0], reader = new FileReader();
        reader.onload = function () {
            var object3d = objLoader.parse(reader.result);
            loadGeometry(object3dToGeometry(object3d));
        };
        reader.readAsText(file);
    };
    window.onload = function () {
        objLoader.load('models/chameleon.obj', function (object3d) {
            var geometry = object3dToGeometry(object3d);
            geometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI / 2));
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -1, 0));
            loadGeometry(geometry);
        });
        // Render loop
        var render = function () {
            if (chameleon) {
                chameleon.update();
            }
            requestAnimationFrame(render);
        };
        render();
    };
})();
