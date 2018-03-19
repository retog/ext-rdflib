# ext-rdflib.js [![Build Status](https://travis-ci.org/retog/ext-rdflib.svg?branch=master)](https://travis-ci.org/retog/ext-rdflib)

An experimental blend of [rdflib.js](https://github.com/linkeddata/rdflib.js) and [rdf-ext](https://github.com/rdf-ext/rdf-ext).

## Description

ext-rdflib.js decorates [rdf-ext](https://github.com/rdf-ext/rdf-ext) to be somehow compatible with [rdflib.js](https://github.com/linkeddata/rdflib.js). The goal is not full compatibility (this would defeat the goal of getting rid of some rdflib.js peculiarities) but to make using rdf-ext easier expecially to those who know rdflib.js.

Also I add features as I need them and you're invited to do the same. The design principle is to add features that are compatible with the rdflib.js API without breaking the rdf-ext API.

## Usage

With node.js:

    const $rdf = require("ext-rdflib");

In the browser:

    <script type="text/javascript" src="https://retog.github.io/ext-rdflib/latest/rdf.js"></script>

The `$rdf` variable will provide all method of rdf-ext plus some methods to mimick the rdflib.js API.

# Features

Parsing in all formats supported by rdflib.js is supported. However the `parse` method must be clled asynchronously:

    parse(content, store, base, mediaType, (error, store) => {
        //do something
    })

Note that support for RDFa and RDF/XML have has not been added to rdf-ext as it should be done,
they are only supported when calling the rdflib.js-style method as this code has been taken from rdflib.js virtually without modification.

# Size

The browser-distribution of ext-rdflib.js that inludes rdf-ext and the required parsers is
currently 592 KB which is significantly smaller than rdflib.js which is 1.64 MB. Obviously the size will grow as more features are added.
