import "core-js/stable";
import "regenerator-runtime/runtime";
import rdfjsDataModel  from "@rdfjs/data-model";
import dataModel from 'rdf-data-model';
import $rdf, {  Serializers, Parsers, graph as _graph, namedNode, Util, version as _version, blankNode, literal as __literal, quad as _quad } from "rdf-ext";
import fetch from "node-fetch";
import {parseString as parseRDFaString} from "@factsmission/rdfa-parser";
import { quadToNTriples } from '@rdfjs/to-ntriples';


//const formats = require('rdf-formats-common')();
import stringToStream from 'string-to-stream';
const DOMParser = (function() {
    if (typeof window !== 'undefined') {
        return window.DOMParser;
    } else {
        return require('xmldom').DOMParser;
    }
})();

const version = typeof VERSION !== 'undefined' ?  VERSION : 'development'; 


$rdf.serializers = new Serializers();
$rdf.parsers = new Parsers();
import SerializerJsonld from "@rdfjs/serializer-jsonld";
$rdf.serializers["application/ld+json"] = new SerializerJsonld();

import NTriplesSerializer from "@rdfjs/serializer-ntriples";
$rdf.serializers["application/n-triples"] = new NTriplesSerializer();
$rdf.serializers["text/n3"] = new NTriplesSerializer();
$rdf.serializers["text/turtle"] = new NTriplesSerializer();

$rdf.parsers["application/ld+json"] = new (require("@rdfjs/parser-jsonld"))();

import N3Parser from "@rdfjs/parser-n3";
$rdf.parsers["application/n-triples"] = new N3Parser();
$rdf.parsers["application/n-quads"] = new N3Parser();
$rdf.parsers["application/trig"] = new N3Parser();
$rdf.parsers["text/n3"] = new N3Parser();
$rdf.parsers["text/turtle"] = new N3Parser();


let Headers = ((h) => h ? h : window.Headers)(fetch.Headers);

/**
 * 
 * Fetches an RDF graph. If the server return 401 the login process will be 
 * started upon which the fetch will be retried.
 *
 * @param uri {string} The URI to be fetched
 * @param options passed to $rdf.Fetcher
 * @param login {boolean} The login function to be called, optional
 *
 * @return {Promise<Response>} Response has a `graph`property with the rertived graph
 */
$rdf.rdfFetch = function(uri, options, login) {
    function plainFetch(uri, init = {}) {
        if (!init.headers) {
            init.headers = new Headers();
        }
        if (!init.headers.get("Accept")) {
            init.headers.set("Accept", "text/turtle;q=1, application/n-triples;q=.9, "+
                "application/rdf+xml;q=.8, application/ld+json;q=.7, */*;q=.1");
        }
        return fetch(uri, init).then(response => {
            if (response.ok) {
                response.graph = () => new Promise((resolve, reject) => {
                    let graph = $rdf.graph();
                    let mediaType = response.headers.get("Content-type").split(";")[0];
                    return response.text().then(text => {
                        $rdf.parse(text, graph, uri, mediaType, (error, graph) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(graph);
                            }
                        });
                    });
                });
                return response;
            } else {
                return response;
            }
        });
    };
    var ggg = this;
    return plainFetch(uri, options).then(function (response) {
        if (response.status < 300) {
            return response;
        } else {
            if (login && response.status === 401) {
                console.log("Got 401 response, attempting to login");
                return login().then(function () {
                    return ggg.rdfFetch(uri, options);
                });
            } else {
                return response;
            }
        }
    });
};

$rdf.sym = $rdf.namedNode;

$rdf.parse = function(string, graph, baseIRI, mediaType, callback) {
    if (!callback) {
        return new Promise((accept, reject) => $rdf.parse(string, graph, baseIRI, mediaType, 
            (error, result) => error ? reject(error) : accept(result)));
    } else {
        if ((mediaType === "application/rdf+xml")) {
            let RdfXmlParser = require("./rdfxmlparser").default;
            let rdfXmlParser = new RdfXmlParser(graph);
            rdfXmlParser.parse($rdf.Util.parseXML(string), baseIRI, $rdf.sym(baseIRI));
            callback(null, graph);
            return;
        }
        if ((mediaType === "text/html")) {     
            try {
                parseRDFaString(string, quad => graph.add(quad), baseIRI);
            } catch(error) {
                callback(error);
                return;
            }
            callback(null, graph);
            return;
        }
        let parser = $rdf.parsers[mediaType.split(";")[0]];
        if (!parser) {
            callback("No Parser for "+mediaType);
            return;
        }
        let quadStream = parser.import(stringToStream(string), {
            'baseIRI': baseIRI
        });
        quadStream.on('data', (quad) => {
            graph.add(quad);
        });
        quadStream.on('error', (error) => {
            callback(error, null);
        });
        quadStream.on('end', () => {
            callback(null, graph);
        });
    }
}

$rdf.version = "Ext-RDFLib " + version;

$rdf.Util = {
    parseXML : function(str, options) {
        let parser = new DOMParser();
        return parser.parseFromString(str, 'application/xml');
    }
}

let DataSetPrototype = Object.getPrototypeOf($rdf.graph());


if (!DataSetPrototype.hasOwnProperty("statements")) {
    Object.defineProperty(DataSetPrototype, "statements", {
        get: function myProperty() {
            return this.toArray();
        }
    });
};


DataSetPrototype.statementsMatching = function(s,p,o,g) {
    return this.match(s,p,o,g).toArray();
}

DataSetPrototype.anyStatementMatching = function(s,p,o,g) {
    return this.statementsMatching(s,p,o,g)[0];
}

DataSetPrototype.each = function(subject, predicate) {
    return this.match(subject, predicate).toArray().map(t => t.object);
};

DataSetPrototype.toNT = function() {
    return this.toArray().map(q => quadToNTriples(q)).join("\n");
};

DataSetPrototype.namespaces = {};

DataSetPrototype.setPrefixForURI = function(prefix, nsuri) {
    this.namespaces[prefix] = nsuri;
}

DataSetPrototype.sym = $rdf.sym;
DataSetPrototype.bnode = $rdf.blankNode;
DataSetPrototype.literal = $rdf.literal;

let addQuad = DataSetPrototype.add;

DataSetPrototype.add = function(subjectOrQuad, p, o, g) {
    if (("subject" in subjectOrQuad) && ("predicate" in subjectOrQuad)) {
        addQuad.call(this, subjectOrQuad);
    } else {
        addQuad.call(this, $rdf.quad(subjectOrQuad, p, o, g));
    }
}

let LiteralPrototype = Object.getPrototypeOf($rdf.literal());

Object.defineProperty(LiteralPrototype, "lang", {
    get: function myProperty() {
        return this.language;
    }
});

let LiteralPrototype2 = Object.getPrototypeOf(rdfjsDataModel.literal());

Object.defineProperty(LiteralPrototype2, "lang", {
    get: function myProperty() {
        return this.language;
    }
});

let LiteralPrototype3 = Object.getPrototypeOf(dataModel.literal());

Object.defineProperty(LiteralPrototype3, "lang", {
    get: function myProperty() {
        return this.language;
    }
});

export default $rdf;
