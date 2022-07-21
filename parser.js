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
    const articleHeadline = $('title').text().replace(' - The New York Times', '');
    const articleText = $('section[name="articleBody"]').html();
    return { articleText, articleHeadline };
}

async function nytCooking(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').text().replace(' - NYT Cooking', '');
    const articleText = $('.recipe-instructions').html();
    return { articleText, articleHeadline };
}

async function newyorker(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const scriptTag = $('script[type="application/ld+json"]').text().split(',\'keywords\':');
    const badJsonFixer = JSON.parse(`${scriptTag[0]}}`); // wtf
    const articleText = marked.parse(badJsonFixer.articleBody);
    const articleHeadline = badJsonFixer.headline;
    return { articleText, articleHeadline };
}

async function economist(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('article h1').text();
    let articleText = '';
    $('[class^="article__body-"]').get().map(a => {
        const html = $(a).html();
        if (html) {
            articleText += `${html}<br /><br />`;
        }
    });
    return { articleText, articleHeadline };
}

async function washingtonPost(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    $('[data-qa="article-body-ad"]').remove();
    $('[data-qa="subscribe-promo"]').remove();
    $('.hide-for-print').remove();
    const articleHeadline = $('span[data-qa="headline-text"]').text();
    let articleText = '';
    $('[data-qa="article-body"]').get().map(a => {
        const html = $(a).html();
        if (html) {
            articleText += html;
        }
    });
    return { articleText, articleHeadline };
}

async function vogue(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').first().text().replace(' | Vogue', '');
    let articleText = '';
    $('.body__inner-container').get().map(a => {
        const html = $(a).html();
        if (html) {
            articleText += `${html}<br />`;
        }
    });
    return { articleText, articleHeadline };
}

async function getContent(source, url) {
    let articleText = null;
    let articleHeadline = null;
    const archiveUrl = await checkUrl(url);
    switch(source) {
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
        case 'newyorker':
            const newyorkerRes = await newyorker(archiveUrl);
            articleText = newyorkerRes.articleText;
            articleHeadline = newyorkerRes.articleHeadline;
            break;
        case 'economist':
            const economistRes = await economist(archiveUrl);
            articleText = economistRes.articleText;
            articleHeadline = economistRes.articleHeadline;
            break;
        case 'washingtonpost':
            const washingtonPostRes = await washingtonPost(archiveUrl);
            articleText = washingtonPostRes.articleText;
            articleHeadline = washingtonPostRes.articleHeadline;
            break;
        case 'vogue':
            const vogueRes = await vogue(archiveUrl);
            articleText = vogueRes.articleText;
            articleHeadline = vogueRes.articleHeadline;
            break;
        
    }
    return {articleText, articleHeadline};
}

module.exports = {
    getContent,
}
