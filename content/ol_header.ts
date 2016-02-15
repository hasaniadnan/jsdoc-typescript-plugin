//
// openlayers.d.ts
//
// TypeScript definition file for OpenLayers 3
//
// This file is automatically generated by jsdoc-typescript-plugin. Do not edit this file
// unless you know what you're doing
//

// Stubs for Closure Library types

declare module goog {
    class Disposable {
        
    }
    module events {
        class Event {
            
        }
        class EventTarget {
            
        }
    }
}

// NOTE:
//
// Due to the use of Closure Library in OpenLayers 3, any custom callback types detected will always be emitted out as Function due to the use of @typedef
// instead of @callback. It is not possible to document these function types with @callback as:
//
//  1. It will cause Closure Compiler to raise errors (if replacing @typedef with @callback, even if @callback is registered as a custom annotation)
//  2. It will be ignored by JSDoc (if @typedef and @callback co-exist)
//
// As we cannot replace @typedef with @callback (as this breaks Closure Compiler) and inserting @callback alongside @typedef has no effect (the @callback is ignored
// by JSDoc, as it gives @typedef higher priority), we have no choice but to manually define these custom function types here, and ignore said types in the
// plugin confiugration so that these custom function types aren't double-defined.
//
// For more information, refer to the (aborted) pull request: https://github.com/openlayers/ol3/pull/4827 
//
// TODO: The original function typedef is present in the "comments" part of the parsed doclet. We could try to manually parse this bit out and extract the
// relevant type information from it

declare module ol {
    /**
     * A function returning the canvas element (`{HTMLCanvasElement}`)
     * used by the source as an image. The arguments passed to the function are:
     * {@link ol.Extent} the image extent, `{number}` the image resolution,
     * `{number}` the device pixel ratio, {@link ol.Size} the image size, and
     * {@link ol.proj.Projection} the image projection. The canvas returned by
     * this function is cached by the source. The this keyword inside the function
     * references the {@link ol.source.ImageCanvas}.
     */
    type CanvasFunctionType = (imgExtent: ol.Extent, imgResolution: number, devPixelRatio: number, imgSize: ol.Size, imgProjection: ol.proj.Projection) => HTMLCanvasElement;
    
    /**
     * A function that takes a {@link ol.Coordinate} and transforms it into a
     * `{string}`.
     */
    type CoordinateFormatType = (coordinate?: ol.Coordinate) => string;
    
    /**
     * {@link ol.source.Vector} sources use a function of this type to load
     * features.
     *
     * This function takes an {@link ol.Extent} representing the area to be loaded,
     * a `{number}` representing the resolution (map units per pixel) and an
     * {@link ol.proj.Projection} for the projection  as arguments. `this` within
     * the function is bound to the {@link ol.source.Vector} it's called from.
     *
     * The function is responsible for loading the features and adding them to the
     * source.
     */
    type FeatureLoader = (extent: ol.Extent, resolution: number, projection: ol.proj.Projection) => void;
    
    /**
     * {@link ol.source.Vector} sources use a function of this type to get the url
     * to load features from.
     *
     * This function takes an {@link ol.Extent} representing the area to be loaded,
     * a `{number}` representing the resolution (map units per pixel) and an
     * {@link ol.proj.Projection} for the projection  as arguments and returns a
     * `{string}` representing the URL.
     */
    type FeatureUrlFunction = (extent: ol.Extent, resolution: number, projection: ol.proj.Projection) => string;
    
    /**
     * A function that returns an array of {@link ol.style.Style styles} given a
     * resolution. The `this` keyword inside the function references the
     * {@link ol.Feature} to be styled.
     */
    type FeatureStyleFunction = (resolution: number) => ol.style.Style|ol.style.Style[];
    
    /**
     * A function that takes an {@link ol.Image} for the image and a `{string}` for
     * the src as arguments. It is supposed to make it so the underlying image
     * {@link ol.Image#getImage} is assigned the content specified by the src. If
     * not specified, the default is
     *
     *     function(image, src) {
     *       image.getImage().src = src;
     *     }
     *
     * Providing a custom `imageLoadFunction` can be useful to load images with
     * post requests or - in general - through XHR requests, where the src of the
     * image element would be set to a data URI when the content is loaded.
     */
    type ImageLoadFunctionType = (image: ol.Image, src: string) => void;
    
    /**
     * A data loading strategy
     */
    type LoadingStrategy = (extent: ol.Extent, resolution: number) => ol.Extent[];
    
    /**
     * Function to perform manipulations before rendering. This function is called
     * with the {@link ol.Map} as first and an optional {@link olx.FrameState} as
     * second argument. Return `true` to keep this function for the next frame,
     * `false` to remove it.
     */
    type PreRenderFunction = (map: ol.Map, state?: olx.FrameState) => boolean;
    
    /**
     * A transform function accepts an array of input coordinate values, an optional
     * output array, and an optional dimension (default should be 2).  The function
     * transforms the input coordinate values, populates the output array, and
     * returns the output array.
     */
    type TransformFunction = (input: number[], output?: number[], dimension?: number) => number[];
    
    /**
     * {@link ol.source.Tile} sources use a function of this type to get the url
     * that provides a tile for a given tile coordinate.
     *
     * This function takes an {@link ol.TileCoord} for the tile coordinate, a
     * `{number}` representing the pixel ratio and an {@link ol.proj.Projection} for
     * the projection  as arguments and returns a `{string}` representing the tile
     * URL, or undefined if no tile should be requested for the passed tile
     * coordinate.
     */
    type TileUrlFunctionType = (tileCoord: ol.TileCoord, pixelRatio: number, projection: ol.proj.Projection) => string|void;
    
    /**
     * A function that takes an {@link ol.Tile} for the tile and a
     * `{string}` for the url as arguments.
     */
    type TileLoadFunctionType = (tile: ol.Tile, url: string) => void;
    
    /**
     * A function that is called with a tile url for the features to load and
     * a callback that takes the loaded features as argument.  
     */
    type TileVectorLoadFunctionType = (tileUrl: string, callback: (features: ol.Feature[]) => void) => void;
    
    module events {
        /**
         * A function that takes an {@link ol.MapBrowserEvent} and returns a
         * `{boolean}`. If the condition is met, true should be returned.
         */
        type ConditionType = (event: ol.MapBrowserEvent) => boolean;
    }
    module style {
        /**
         * A function that takes an {@link ol.Feature} and a `{number}` representing
         * the view's resolution. The function should return an array of
         * {@link ol.style.Style}. This way e.g. a vector layer can be styled.
         */
        type StyleFunction = (feature: ol.Feature|ol.render.Feature, resolution: number) => ol.style.Style|ol.style.Style[];
        
        /**
         * A function that takes an {@link ol.Feature} as argument and returns an
         * {@link ol.geom.Geometry} that will be rendered and styled for the feature.
         */
        type GeometryFunction = (feature: ol.Feature|ol.render.Feature) => ol.geom.Geometry|ol.render.Feature;
    }
    module raster {
        /**
         * A function that takes an array of input data, performs some operation, and
         * returns an array of ouput data.  For `'pixel'` type operations, functions
         * will be called with an array of {@link ol.raster.Pixel} data and should
         * return an array of the same.  For `'image'` type operations, functions will
         * be called with an array of {@link ImageData
         * https://developer.mozilla.org/en-US/docs/Web/API/ImageData} and should return
         * an array of the same.  The operations are called with a second "data"
         * argument, which can be used for storage.  The data object is accessible
         * from raster events, where it can be initialized in "beforeoperations" and
         * accessed again in "afteroperations".
         */
        type Operation = (input: ol.raster.Pixel[]|ImageData[], data: Object) => ol.raster.Pixel[]|ImageData[];
    }
    module interaction {
        /**
         * A function that takes a {@link ol.MapBrowserEvent} and two
         * {@link ol.Pixel}s and returns a `{boolean}`. If the condition is met,
         * true should be returned.
         */
        type DragBoxEndConditionType = (event: ol.MapBrowserEvent, pixel1: ol.Pixel, pixel2: ol.Pixel) => boolean;
        
        /**
         * Function that takes coordinates and an optional existing geometry as
         * arguments, and returns a geometry. The optional existing geometry is the
         * geometry that is returned when the function is called without a second
         * argument.
         */
        type DrawGeometryFunctionType = (coordinates: ol.Coordinate|ol.Coordinate[]|ol.Coordinate[][], opt_geometry?: ol.geom.SimpleGeometry) => ol.geom.SimpleGeometry;
        
        /**
         * A function that takes an {@link ol.Feature} or {@link ol.render.Feature} and
         * an {@link ol.layer.Layer} and returns `true` if the feature may be selected
         * or `false` otherwise.
         */
        type SelectFilterFunction = (feature: ol.Feature|ol.render.Feature, layer: ol.layer.Layer) => boolean;
    }
}