# ext-rdflib.js
ext-rdflib.js decorates [rdf-ext](https://github.com/rdf-ext/rdf-ext) to be somehow compatible with [rdflib.js](https://github.com/linkeddata/rdflib.js). The goal is not full compatibility (this would defeat the goal of getting rid of some rdflib.js peculiarities) but to make using rdf-ext easier expecially to those who know rdflib.js.

## Usage

const $rdf = require("ext-rdflib");

The `$rdf` variable will provide all method of rdf-ext plus some methods to mimick the rdflib.js API.
