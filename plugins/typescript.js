/// <reference path="../typings/tsd.d.ts" />
/**
 * @overview Generates a TypeScript definition file from assembled JSDoc doclets
 * @module plugins/typescript
 * @author Jackie Ng <jumpinjackie@gmail.com>
 */
'use strict';

var CLS_DESC_PLACEHOLDER = "%TYPENAME%";

var fs = require('fs');
var env = require('jsdoc/env');
var config = env.conf.typescript || {};
var moduleName = config.rootModuleName || "generated";
var outDir = config.outDir || ".";
var tsAliases = config.typeReplacements || {};
var defaultCtorDesc = config.defaultCtorDesc || ("Constructor for " + CLS_DESC_PLACEHOLDER);
var fillUndocumentedDoclets = !!config.fillUndocumentedDoclets;
var outputDocletRefs = !!config.outputDocletRefs;
var globalTypeAliases = (config.aliases || {}).global || {};
var moduleTypeAliases = (config.aliases || {}).module || {};
var fileName = outDir + "/" + moduleName + ".d.ts";
var indentLevel = 0;

/**
 * JS -> TypeScript type aliases. Any such types encountered in the JSDoc
 * annotations will be replaced with the specified replacement here
 */
var TS_ALIASES = {
    "*": "any",
    "Object": "any",
    "function": "Function"
};

/**
 * Filter function for JSON.stringify calls on doclet instances
 */
function JsDocletStringifyFilter(key, value) { 
    if (key === "comment") { 
        return undefined; 
    }
    if (key == "meta") {
        return undefined;
    }
    return value; 
}

function str_repeat(pattern, count) {
    if (count < 1) return '';
    var result = '';
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
}

function indent() {
    return str_repeat(" ", indentLevel * 4);
}

function ensureClassDef(classes, longname, bCreateIfNotExists) {
    var clsDef = null;
    if (!classes.hasOwnProperty(longname) && !!bCreateIfNotExists) {
        clsDef = {
            name: null,
            fullname: longname,
            ctor: null,
            extends: null,
            description: null,
            methods: [],
            properties: [],
            docletRef: null,
            parentModule: null,
            genericTypes: []
        };
        classes[longname] = clsDef; 
    } else {
        clsDef = classes[longname];
    }
    return clsDef;
}

function getTypeReplacement(typeName) {
    //Look in user configured overrides
    if (tsAliases.hasOwnProperty(typeName)) {
        return tsAliases[typeName];
    }
    //Then look at plugin configured overrides
    if (TS_ALIASES.hasOwnProperty(typeName)) {
        return TS_ALIASES[typeName];
    } else {
        //Before returning, see if the type annotation matches known patterns
        
        //Array - untyped
        if (typeName.toLowerCase() == "array") {
            //Warning: untyped array
            return "any[]";
        }
        //Union-type - typeA|typeB
        if (typeName.indexOf("|") >= 0) {
            var types = typeName.split("|");
            var replTypes = [];
            for (var i = 0; i < types.length; i++) {
                replTypes.push(getTypeReplacement(types[i].trim()));
            }
            return replTypes.join("|");
        }
        //Array - Array.<type>
        var rgxm = typeName.match(/(Array\.)\<(.+)>/); 
        if (rgxm) {
            return getTypeReplacement(rgxm[2].trim()) + "[]";
        }
        //Array - type[]
        rgxm = typeName.match(/(.+)\[\]$/);
        if (rgxm) {
            return getTypeReplacement(rgxm[1].trim()) + "[]";
        }
        //kvp - Object.<TKey, TValue> -> { [key: TKey]: TValue; }
        rgxm = typeName.match(/(Object\.)\<(.+)\,(.+)\>/);
        if (rgxm) {
            var keyType = getTypeReplacement(rgxm[2].trim());
            var valueType = getTypeReplacement(rgxm[3].trim());
            return "{ [key: " + keyType + "]: " + valueType + "; }";
        }
        //Some generic type - SomeGenericType.<AnotherType>
        rgxm = typeName.match(/(.+)(.\<)(.+)\>/);
        if (rgxm) {
            var genericType = getTypeReplacement(rgxm[1]);
            var genericTypeArgs = rgxm[3].split(",").map(function(tn) { return getTypeReplacement(tn.trim()); });
            return genericType + "<" + genericTypeArgs.join(",") + ">";
        }
        //No other replacement suggestions, return as is
        return typeName;
    }
}

function outputSignature(name, desc, sig, genericTypes, scope) {
    var content = "";
    content += indent() + "/**\n";
    if (desc != null) {
        var descParts = desc.split("\n");
        for (var i = 0; i < descParts.length; i++) {
            content += indent() + " * " + descParts[i] + "\n";
        }
    } else if (fillUndocumentedDoclets) {
        content += indent() + " * TODO: This method has no description. Contact the library author if this method should be documented\n";
    }
    //If we have args, document them. Because TypeScript is ... typed, the {type}
    //annotation is not necessary
    if (sig != null && sig.length > 0) {
        var forceNullable = false;
        for (var i = 0; i < sig.length; i++) {
            var arg = sig[i];
            var req = "";
            if (forceNullable || arg.nullable == true) {
                // You can't have non-nullable arguments after a nullable argument. So by definition
                // everything after the nullable argument has to be nullable as well
                forceNullable = true;
                req = " (Optional)";
            } else {
                req = " (Required)";
            }
            var argDesc = arg.description || "";
            if (argDesc == "" && fillUndocumentedDoclets) {
                argDesc = "TODO: This parameter has no description. Contact this library author if this parameter should be documented\n";
            }
            content += indent() + " * @param " + arg.name + " " + req + " " + argDesc + "\n";
        }
    }
    content += indent() + " */\n"
    var sc = (scope == "static" ? "static " : "");
    content += indent() + sc + name;
    if (genericTypes && genericTypes.length > 0) {
        content += "<" + genericTypes.join(", ") + ">";
    }
    content += "(";
    //Output args
    if (sig != null && sig.length > 0) {
        var forceNullable = false;
        for (var i = 0; i < sig.length; i++) {
            var arg = sig[i];
            if (i > 0) {
                content += ", ";
            }
            content += arg.name;
            if (forceNullable || arg.nullable == true) {
                // In TypeScript (and most compiled languages), you can't have non-nullable arguments after a nullable argument. 
                // So by definition everything after the nullable argument has to be nullable as well
                forceNullable = true;
                content += "?: ";
            } else {
                content += ": ";
            }
            if (arg.type != null) {
                //Output as TS union type
                var utypes = [];
                if (arg.type.names.length > 0) {
                    for (var j = 0; j < arg.type.names.length; j++) {
                        var typeName = getTypeReplacement(arg.type.names[j]);
                        //Is this a valid JSDoc annotated type? Either way, I don't know what the equivalent to use for TypeScript, so skip
                        if (typeName == "undefined" || typeName == "null")
                            continue;
                        utypes.push(typeName);
                    }
                }
                content += utypes.join("|");
            } else {
                //Warning: No type annotation
                //Fallback to any
                content += "any";
            }
        }
    }
    content += ");\n";
    return content; 
}

function outputTypedef(tdf) {
    if (tdf == null) {
        //console.log("BOGUS: null typedef found");
        return "";
    }
    if (tdf.name == null) {
        //console.log("BOGUS: typedef has null name");
        return "";
    }

    var content = "";
    if (tdf.docletRef != null && outputDocletRefs) {
        content += "/* doclet for typedef\n";
        content += JSON.stringify(tdf.docletRef, JsDocletStringifyFilter, 4);
        content += "\n */\n";
    }
    
    //Description as class comments
    if (tdf.description != null) {
        content += indent() + "/**\n";
        var descParts = tdf.description.split("\n");
        for (var i = 0; i < descParts.length; i++) {
            content += indent() + " * " + descParts[i] + "\n";
        }
        content += indent() + " */\n";
    } else if (fillUndocumentedDoclets) {
        content += indent() + "/**\n";
        content += indent() + " * TODO: This typedef has no documentation. Contact the library author if this class should be documented\n";
        content += indent() + " */\n";
    }
    content += indent() + "export type " + tdf.name;
    
    //Fallback
    content += " = any; //TODO: Could not determine underlying type for this typedef. Falling back to 'any'\n";
    
    return content;
}

function outputClass(cls) {
    if (cls == null)
        return "";
    if (cls.name == null)
        return "";
    
    //Case not handled. Class with ':' in its name
    if (cls.name.indexOf(":") >= 0)
        return indent() + "//Skipped class (" + cls.name + "). Case not handled yet: ':' in class name\n";
        
    var content = ""; 
    
    if (cls.docletRef != null && outputDocletRefs) {
        content += "/* doclet for class\n";
        content += JSON.stringify(cls.docletRef, JsDocletStringifyFilter, 4);
        content += "\n */\n";
    }
    
    //Description as class comments
    if (cls.description != null) {
        content += indent() + "/**\n";
        var descParts = cls.description.split("\n");
        for (var i = 0; i < descParts.length; i++) {
            content += indent() + " * " + descParts[i] + "\n";
        }
        content += indent() + " */\n";
    } else if (fillUndocumentedDoclets) {
        content += indent() + "/**\n";
        content += indent() + " * TODO: This class has no documentation. Contact the library author if this class should be documented\n";
        content += indent() + " */\n";
    }
    content += indent() + "export class " + cls.name;
    //Class generic parameters
    if (cls.genericTypes.length > 0) {
        content += "<" + cls.genericTypes.join(", ") + ">";
    }
    //Inheritance
    if (cls.extends != null) {
        content += " extends " + cls.extends.fullname;
    }
    content += " {\n";
    
    indentLevel++; //Start class members
    if (cls.ctor != null) {
        content += outputSignature("constructor", (cls.ctor.description || defaultCtorDesc.replace(CLS_DESC_PLACEHOLDER, cls.name)), cls.ctor.signature);
    }
    for (var i = 0; i < cls.methods.length; i++) {
        var method = cls.methods[i];
        content += outputSignature(method.name, method.description, method.signature, method.genericTypes, method.scope);
    }
    indentLevel--; //End class members
    
    content += indent() + "}\n";
    return content;
}

function moduleDecl(name) {
    return "declare module \"" + name + "\"";
}

function beginModuleDecl(cls, writeFunc) {
    if (!cls.parentModule) {
        return;
    }
    
    if (cls.parentModule.indexOf("/") >= 0) { //AMD-style
        writeFunc("declare module \"" + cls.parentModule + "\" {\n");
        indentLevel++;
    } else {
        writeFunc("declare module " + cls.parentModule + " {\n");
        indentLevel++;
    }
}

function endModuleDecl(cls, writeFunc) {
    if (!cls.parentModule) {
        return;
    }
    
    if (cls.parentModule.indexOf("/") >= 0) { //AMD-style
        writeFunc("}\n");
        indentLevel--;
    } else {
        writeFunc("}\n");
        indentLevel--;
    }
}

function extractGenericTypesFromDocletTags(tags, genericTypes) {
    //@template is non-standard, but the presence of this annotation conveys
    //generic type information that we should capture
    var genericTypeTags = tags.filter(function(tag) { return tag.originalTitle == "template"});
    if (genericTypeTags.length > 0) {
        for (var j = 0; j < genericTypeTags.length; j++) {
            //No TS type replacement here as the value is the generic type placeholder
            genericTypes.push(genericTypeTags[j].value);
        }
    }
}

function isPrivateDoclet(doclet) {
    return doclet.access == "private";
}

function process(doclets) {
    var classes = {};
    var typedefs = {};
    
    var output = fs.createWriteStream(fileName);
    
    var content = "/**";
    content += "\n * " + fileName
    content += "\n * ";
    content += "\n * This file was automatically generated by the typescript JSDoc plugin";
    content += "\n * Do not edit this file unless you know what you're doing";
    content += "\n */\n";
    
    output.write(content);
    
    //1st pass: Process classes and typedefs
    for (var i = 0; i < doclets.length; i++) {
        var doclet = doclets[i];
        //TypeScript definition covers a module's *public* API surface, so
        //skip private classes
        if (isPrivateDoclet(doclet))
            continue;
        
        if (doclet.kind == "class") {
            var parentModName = null;
            if (doclet.longname.indexOf("module:") >= 0) {
                //Assuming that anything annotated "module:" will have a "." to denote end of module and start of class name
                var modLen = "module:".length;
                var dotIdx = doclet.longname.indexOf(".");
                if (dotIdx < 0)
                    dotIdx = doclet.longname.length;
                parentModName = doclet.longname.substring(modLen, dotIdx);
            } else if (doclet.memberof) {
                parentModName = doclet.memberof;
            }
            
            //Key class definition on longname
            var cls = ensureClassDef(classes, doclet.longname, true);
            cls.docletRef = doclet;
            cls.name = doclet.name;
            if (doclet.params) {
                cls.ctor = {
                    description: null,
                    signature: doclet.params
                };
            }
            if (doclet.tags) {
                extractGenericTypesFromDocletTags(doclet.tags, cls.genericTypes)
            }
            if (parentModName != null)
                cls.parentModule = parentModName;
            if (doclet.description || doclet.classdesc)
                cls.description = doclet.description || doclet.classdesc;
        } else if (doclet.kind == "typedef") {
            typedefs[doclet.longname] = {
                name: doclet.name,
                fullname: doclet.longname,
                description: doclet.description,
                parentModule: doclet.memberof,
                docletRef: doclet
            };
        }
    }
    //2nd pass: Look for members
    for (var i = 0; i < doclets.length; i++) {
        var doclet = doclets[i];
        if (!doclet.memberof)
            continue;

        //TypeScript definition covers a module's *public* API surface, so
        //skip private members
        if (isPrivateDoclet(doclet))
            continue;
        
        //We've keyed class definition on longname, so memberof should
        //point to it
        var cls = ensureClassDef(classes, doclet.memberof);
        if (!cls) {
            continue;
        }
        
        if (doclet.kind == "value") {
            cls.properties.push({
                scope: doclet.scope,
                name: doclet.name,
                description: doclet.description,
                docletRef: doclet
            });
        } else if (doclet.kind == "function") {
            var genericTypeArgs = [];
            if (doclet.tags) {
                extractGenericTypesFromDocletTags(doclet.tags, genericTypeArgs);
            }
            cls.methods.push({
                scope: doclet.scope,
                name: doclet.name,
                description: doclet.description,
                signature: doclet.params,
                docletRef: doclet,
                genericTypes: genericTypeArgs
            });
        }
    }
    
    //Output user-injected type aliases
    //global
    for (var typeAlias in globalTypeAliases) {
        var tdfContent = "export type " + typeAlias + " = " + globalTypeAliases[typeAlias] + ";\n";
        output.write(tdfContent);
    }
    //module
    for (var moduleName in moduleTypeAliases) {
        var tdfContent = "";
        beginModuleDecl({ parentModule: moduleName }, function(val) { tdfContent += val; });
        for (var typeAlias in moduleTypeAliases[moduleName]) {
            tdfContent += indent() + "export type " + typeAlias + " = " + moduleTypeAliases[moduleName][typeAlias] + ";\n";
        }
        endModuleDecl({ parentModule: moduleName }, function(val) { tdfContent += val; });
        output.write(tdfContent);
    }
    
    //Output the typedefs
    for (var qTypeName in typedefs) {
        var tdfContent = "";
        var tdf = typedefs[qTypeName];
        beginModuleDecl(tdf, function(val) { tdfContent += val; });
        tdfContent += outputTypedef(tdf);
        endModuleDecl(tdf, function(val) { tdfContent += val; });
        output.write(tdfContent);
        console.log("Wrote typedef: " + qTypeName);
    }
    
    //Output the classes
    for (var qClsName in classes) {
        var clsContent = "";
        var cls = classes[qClsName];
        //Begin module
        beginModuleDecl(cls, function(val) { clsContent += val; });
        clsContent += outputClass(cls);
        endModuleDecl(cls, function(val) { clsContent += val; });
        output.write(clsContent);
        console.log("Wrote class: " + qClsName);
    }
    
    output.on('finish', function () {
        console.log("Saved TypeScript definition file to: " + fileName);
    });
    output.end();
}

exports.handlers = {
    processingComplete: function(e) {
        process(e.doclets);
        /*
        var output = fs.createWriteStream(fileName);
        for (var i = 0; i < e.doclets.length; i++) {
            output.write(JSON.stringify(e.doclets[i], JsDocletStringifyFilter, 4));
        }
        output.on('finish', function () {
            console.log("Saved TypeScript definition file to: " + fileName);
        });
        output.end();
        */
    }
};