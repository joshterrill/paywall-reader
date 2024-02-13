const { expect } = require('chai');
const parse = require('../parser');
const newsSourceMap = require('../news-source-map.json');


describe('Paywall Reader Tests', () => {
    it ('should check New York Times validity', async () => {
        const url = 'https://www.nytimes.com/2022/07/20/us/politics/american-bridge-trump-federal-election-commission.html';
        const source = 'nytimes.com';
        const method = newsSourceMap[source].method;
        const { articleHeadline, articleText } = await parse.getContent(source, url, method);
        expect(articleHeadline).to.not.be.null;
        expect(articleText).to.not.be.null;
        
    });
});