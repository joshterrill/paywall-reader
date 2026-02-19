const { expect } = require('chai');
const parse = require('../parser');
const newsSourceMap = require('../news-source-map.json');

const ARTICLE_TEST_CASES = [
    {
        id: 'nytimes',
        source: 'nytimes.com',
        url: 'https://www.nytimes.com/2023/07/29/us/politics/china-malware-us-military-bases-taiwan.html',
        minHeadlineLength: 20,
        minArticleTextLength: 500
    },
    {
        id: 'nytimes-cooking',
        source: 'cooking.nytimes.com',
        url: 'https://cooking.nytimes.com/recipes/1023041-qatayef-asafiri-stuffed-semolina-pancakes',
        minHeadlineLength: 10,
        minArticleTextLength: 200
    },
    {
        id: 'newyorker',
        source: 'newyorker.com',
        url: 'https://www.newyorker.com/magazine/2025/07/28/the-mission-the-cia-in-the-21st-century-tim-weiner-book-review',
        minHeadlineLength: 20,
        minArticleTextLength: 500
    },
    {
        id: 'economist',
        source: 'economist.com',
        url: 'https://www.economist.com/culture/2025/07/17/uncovering-the-foibles-of-the-kgb-and-the-cia',
        minHeadlineLength: 20,
        minArticleTextLength: 500
    },
    {
        id: 'washingtonpost',
        source: 'washingtonpost.com',
        url: 'https://www.washingtonpost.com/opinions/2026/02/18/biden-electric-vehicles-detroit/',
        minHeadlineLength: 20,
        minArticleTextLength: 500
    }
];

function hasGoogleEnv() {
    return Boolean(process.env.GOOGLE_SEARCH_ID && process.env.GOOGLE_SEARCH_KEY);
}

async function getContentWithTrailingSlashFallback(source, url, method) {
    try {
        return await parse.getContent(source, url, method);
    } catch (error) {
        if (!url.endsWith('/')) {
            return parse.getContent(source, `${url}/`, method);
        }
        throw error;
    }
}

describe('Paywall Reader End-to-End Tests', function () {

    ARTICLE_TEST_CASES.forEach((testCase) => {
        const sourceConfig = newsSourceMap[testCase.source];
        const methods = sourceConfig?.method || ['DIRECT'];

        methods.forEach((method) => {
            it(`returns content for ${testCase.id} via ${method}`, async function () {
                this.timeout(10000);

                if (method === 'GOOGLE' && !hasGoogleEnv()) {
                    this.skip();
                }

                const { articleHeadline, articleText } = await getContentWithTrailingSlashFallback(
                    testCase.source,
                    testCase.url,
                    method
                );

                expect(articleHeadline, 'headline should be a string').to.be.a('string');
                expect(articleHeadline.trim().length, 'headline length').to.be.greaterThan(testCase.minHeadlineLength);

                expect(articleText, 'article text should be a string').to.be.a('string');
                expect(articleText.trim().length, 'article text length').to.be.greaterThan(testCase.minArticleTextLength);
            });
        });
    });
});
