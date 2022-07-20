const cheerio = require('cheerio');
const fetch = require('node-fetch');
const marked = require('marked');

function sanitizeUrl(url) {
    return url.split('?')[0];
}

async function checkUrl(url) {
    url = sanitizeUrl(url);
    const data = await fetch(`https://archive.org/wayback/available?url=${url}`);
    if (!data) {
        throw new Error('Unable to check URL');
    }
    const json = await data.json();
    if (!json?.archived_snapshots?.closest?.url) {
        throw new Error('Checked URL but no snapshot available');
    }
    return json.archived_snapshots.closest.url;
}

async function nyt(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $("title").text().replace(' - The New York Times', '');
    const articleText = $("section[name='articleBody']").html();
    return { articleText, articleHeadline };
}

async function nytCooking(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $("title").text().replace(' - NYT Cooking', '');
    const articleText = $(".recipe-instructions").html();
    return { articleText, articleHeadline };
}



async function newyorker(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const scriptTag = $("script[type='application/ld+json']").text().split(',"keywords":');
    const badJsonFixer = JSON.parse(`${scriptTag[0]}}`); // wtf
    const articleText = marked.parse(badJsonFixer.articleBody);
    const articleHeadline = badJsonFixer.headline;
    return { articleText, articleHeadline };
}

async function getContent(source, url) {
    let articleText = null;
    let articleHeadline = null;
    const archiveUrl = await checkUrl(url);
    switch(source) {
        case 'newyorker':
            const newyorkerRes = await newyorker(archiveUrl);
            articleText = newyorkerRes.articleText;
            articleHeadline = newyorkerRes.articleHeadline;
            break;
        case 'nyt':
            const nytRes = await nyt(archiveUrl);
            articleText = nytRes.articleText;
            articleHeadline = nytRes.articleHeadline;
            break;
        case 'nytcooking':
            const nytCookingRes = await nytCooking(archiveUrl);
            articleText = nytCookingRes.articleText;
            articleHeadline = nytCookingRes.articleHeadline;
            break;
    }
    return {articleText, articleHeadline};
}

module.exports = {
    getContent,
}
