const expect = require('chai').expect
const $rdf = require('../js/rdf')

let parse = $rdf.parse
let graph = $rdf.graph

describe('Parse', () => {
  describe('ttl', () => {
    describe('literals', () => {
      it('handles language subtags', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> "ангельская Вікіпэдыя"@be-x-old .'
        parse(content, store, base, mimeType, () => {
          expect(store.statements[0].object.lang).to.eql('be-x-old');
        })        
      })
    })
  })
  describe('ttl with charset', () => {
    describe('literals', () => {
      it('handles language subtags', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle;charset=UTF-8'
        let store = graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> "ангельская Вікіпэдыя"@be-x-old .'
        parse(content, store, base, mimeType, () => {
          expect(store.statements[0].object.lang).to.eql('be-x-old')
        })
      })
    })
  })
  describe('a JSON-LD document', () => {
    describe('with a base IRI', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = `
        {
          "@context": {
            "homepage": {
              "@id": "http://xmlns.com/foaf/0.1/homepage",
              "@type": "@id"
            }
          },
          "@id": "../#me",
          "homepage": "xyz"
        }`
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('uses the specified base IRI', () => {
        expect(store.statements).to.have.length(1);
        const statement = store.statements[0]
        expect(statement.subject.value).to.equal('https://www.example.org/#me')
        expect(statement.object.value).to.equal('https://www.example.org/abc/xyz')
      })
    })
  })
  describe('another JSON-LD document', () => {
    describe('with IRI in data', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = `
        [
          {
              "@id":"",
              "@type": "http://schema.org/WebPage",
              "http://schema.org/headline":"An LD2h demo page",
              "http://schema.org/text":[
                  {"@value":"Everything you see on this page is content expressed in RDF either within this\\r\\npage or from somewhere else on the web rendered  in the browser using \\r\\n<a href=\\"http://rdf2h.github.io/rdf2h\\">RDF2h</a> and mustache templates."}
              ]
          },
          {   "@id":"https://farewellutopia.com/me",
              "@type": "http://xmlns.com/foaf/0.1/Person",
              "http://xmlns.com/foaf/0.1/name":[
                  {"@value":"Reto Gmür"}
              ]
          }
        ]
        `
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('uses the specified base IRI', () => {
        expect(store.statements).to.have.length(5);
        const statement = store.statements[0]
        expect(statement.subject.value).to.equal('https://farewellutopia.com/me')
      })
    })
  })
  describe('an RDF/XML document', () => {
    describe('with a base IRI', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/rdf+xml'
        const content = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rdf:RDF
          xmlns:foaf="http://xmlns.com/foaf/0.1/"
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        >
          <rdf:Description rdf:about="#me">
            <foaf:homepage rdf:resource="/xyz"/>
          </rdf:Description>
        </rdf:RDF>`
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('uses the specified base IRI', () => {
        expect(store.statements).to.have.length(1);
        const statement = store.statements[0]
        expect(statement.subject.value).to.equal('https://www.example.org/abc/def#me')
        expect(statement.object.value).to.equal('https://www.example.org/xyz')
      })
    })
    describe('an RDFa document', () => {
      describe('with a base IRI', () => {
        let store
        before(done => {
          const base = 'https://www.example.org/abc/def'
          const mimeType = 'text/html'
          const content = `
          <div id="data" type="text/html"><div about='' >
          <li >
          <ul>
          <a property="http://schema.org/agent" resource="_:org.apache.clerezza.rdf.jena.commons.JenaBNodeWrapper@5e0c9144">_:org.apache.clerezza.rdf.jena.commons.JenaBNodeWrapper@5e0c9144</a>
          </ul>
          </li>
          <li >
          <ul>
          <a property="http://purl.org/dc/terms/source" resource="https://github.com/retog/linked">https://github.com/retog/linked</a>
          </ul>
          </li>
          <li >
          <ul>
          <a property="http://www.w3.org/1999/02/22-rdf-syntax-ns#type" resource="http://schema.org/AskAction">http://schema.org/AskAction</a>
          </ul>
          </li>

          </div>
          <div about='_:org.apache.clerezza.rdf.jena.commons.JenaBNodeWrapper@5e0c9144' >
          <li >
          <ul>
          <span datatype="http://www.w3.org/2001/XMLSchema#string" property="http://schema.org/name">John</span>
          <span datatype="rdf:HTML" property="http://schema.org/comment">bla <i>bla</i> bla</span>
          </ul>
          </li>
          </div>`
          store = graph()
          parse(content, store, base, mimeType, done)
        })
  
        it('uses the specified base IRI', () => {
          expect(store.statements).to.have.length(5);
        })
      })
    })
  })
})
