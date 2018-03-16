const $rdf = require("rdf-ext");
const fetch = require("node-fetch");


const formats = require('rdf-formats-common')();
const stringToStream = require('string-to-stream');
const DOMParser = (function() {
    if (typeof window !== 'undefined') {
        return window.DOMParser;
    } else {
        return require('xmldom').DOMParser;
    }
})();


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
                        if ((mediaType === "text/html")  && (typeof DOMParser !== 'undefined')) {
                            console.log("Working around rdflib problem parsing RDFa in browser");
                            try {
                                RDFaProcessor.parseRDFaDOM($rdf.Util.parseXML(text, { contentType: mediaType }), graph, uri);
                            } catch(error) {
                                reject(error);
                                return;
                            }
                            resolve(graph);
                        } else {
                            $rdf.parse(text, graph, uri, mediaType, (error, graph) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(graph);
                                }
                            });
                        }
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
        if ((mediaType === "text/html")) {
            console.log("RDFa support is rudimentary");
            const RDFaProcessor = (function() {
                if (typeof window === 'undefined') {
                    return require("./rdfaparser");
                } else {
                    return require("./rdfaparser-browser");
                }
            })();
            try {
                RDFaProcessor.parseRDFaDOM($rdf.Util.parseXML(string, { contentType: mediaType }), graph, baseIRI);
            } catch(error) {
                callback(error);
                return;
            }
            callback(null, graph);
        }
        let parser = formats.parsers[mediaType];
        console.log("parser: "+parser);
        if (!parser) {
            callback("No Parser for "+mediaType);
            return;
        }
        let quadStream = parser.import(stringToStream(string), {
            'baseIRI': baseIRI
        });
        quadStream.on('data', (quad) => {
            console.log("the parsed "+ quad.toCanonical() + '\n');
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

$rdf.version = "Ext-RDFLib 1.0.0"

$rdf.Util = {
    parseXML : function(str, options) {
        let parser = new DOMParser();
        return parser.parseFromString(str, 'application/xml');
    }
}

let DataSetPrototype = Object.getPrototypeOf($rdf.graph());

DataSetPrototype.statementsMatching = function(s,p,o,g) {
    return this.match(s,p,o,g).toArray();
}
DataSetPrototype.each = function(subject, predicate) {
    return this.match(subject, predicate).toArray().map(t => t.object);
};

DataSetPrototype.toNT = function() {
    return this.toArray().map(q => `${q.subject.toCanonical()} ${q.predicate.toCanonical()} ${q.object.toCanonical()} ${q.graph.toCanonical()}.`).join("\n");
};

module.exports = $rdf;
