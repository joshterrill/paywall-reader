const cheerio = require('cheerio');
const fetch = require('node-fetch');
const marked = require('marked');

function sanitizeUrl(url) {
    return url.split('?')[0];
}

async function checkUrlArchive(url) {
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

async function checkUrlGoogle(url, site) {
    url = sanitizeUrl(url);
    const searchTerm = url.split('/')[url.split('/').length - 1];
    const res = await fetch(`https://content-customsearch.googleapis.com/customsearch/v1?cx=${process.env.GOOGLE_SEARCH_ID}&key=${process.env.GOOGLE_SEARCH_KEY}&q=${searchTerm}`)
    const json = await res.json();
    if (!json?.items?.length) {
        throw new Error('Unable to get result from search engine');
    }
    const { cacheId } = json.items[0];
    const webCacheUrl = `http://webcache.googleusercontent.com/search?q=cache:${cacheId}:${site}`;
    return webCacheUrl;
}

function formatArticleText(text) {
    text = text.replace(/href="\//g, 'href="https://web.archive.org/');
    // possibly replace all http with https, not just images? -jt
    text = text.replace(/src="http:\/\//g, 'src="https://');
    return text;
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
    const scriptTag = $('script[type="application/ld+json"]').first().text().split(',\'keywords\':');
    const json = JSON.parse(scriptTag[0]);;
    const articleText = $('#articleBody').html();
    const articleHeadline = json.headline;
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
    articleText = formatArticleText(articleText);
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

async function latimes(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').first().text().replace('- Los Angeles Times', '');
    $('.rich-text-article-body-content img').get().forEach(i => {
        const image = $(i);
        const rootUrl = image.attr('data-src').split('?url=')[1];
        image.parent().html(`<img src="${decodeURIComponent(rootUrl)}" />`);
    });
    const articleHtml = $('.rich-text-article-body-content').html();
    const articleText = articleHtml;
    return { articleText, articleHeadline };
}

async function theAthletic(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').first().text().replace('- The Athletic', '');
    const articleHtml = $('.article-content-container').html();
    const articleText = articleHtml;
    return { articleText, articleHeadline };
}

async function businessInsider(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').first().text();
    $('.content-lock-content img.lazy-image').get().forEach(i => {
        const image = $(i);
        image.parent('.lazy-holder').removeAttr('style');
        const imageJson = JSON.parse(image.attr('data-srcs'));
        const rootUrl = Object.keys(imageJson)[0];
        image.parent().html(`<img src="${decodeURIComponent(rootUrl)}" />`);
    });
    $('.inline-newsletter-signup').remove();
    const articleHtml = $('.content-lock-content').html();
    const articleText = articleHtml;
    return { articleText, articleHeadline };
}

async function bloomberg(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const scriptTag = $('script[data-component-props="ArticleBody"]').text();
    const json = JSON.parse(scriptTag);
    const articleText = json.story.body.replace(/60x-1/g, '1200x-1'); // replace low res images with higher res
    const articleHeadline = json.story.seoHeadline;
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

async function atlantic(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').first().text().replace(' - The Atlantic', '');
    let articleText = $("[class^='ArticleBody_root']").html();
    return { articleText, articleHeadline };
}

async function forbes(url) {
    const rawHtml = await fetch(url);
    const html = await rawHtml.text();
    const $ = cheerio.load(html);
    const articleHeadline = $('title').first().text().replace(' - Forbes', '');
    $('.article-body-image').removeAttr('style');
    $('.article-sharing').remove();
    $('progressive-image').get().forEach(i => {
        const image = $(i);
        const rootUrl = image.attr('src');
        image.html(`<img src="${rootUrl}" />`);
    });
    let articleText = $('.article-body').html();

    return { articleText, articleHeadline };
}

async function getContent(source, url, method) {
    console.log(source, url, method);
    let articleText = null;
    let articleHeadline = null;
    if (method === 'ARCHIVE') {
        url = await checkUrlArchive(url);
    } else if (method === 'GOOGLE') {
        url = await checkUrlGoogle(url, source);
    }
    switch(source) {
        case 'nytimes.com':
            const nytRes = await nyt(url);
            articleText = nytRes.articleText;
            articleHeadline = nytRes.articleHeadline;
            break;
        case 'cooking.nytimes.com':
            const nytCookingRes = await nytCooking(url);
            articleText = nytCookingRes.articleText;
            articleHeadline = nytCookingRes.articleHeadline;
            break;
        case 'newyorker.com':
            const newyorkerRes = await newyorker(url);
            articleText = newyorkerRes.articleText;
            articleHeadline = newyorkerRes.articleHeadline;
            break;
        case 'economist.com':
            const economistRes = await economist(url);
            articleText = economistRes.articleText;
            articleHeadline = economistRes.articleHeadline;
            break;
        case 'washingtonpost.com':
            const washingtonPostRes = await washingtonPost(url);
            articleText = washingtonPostRes.articleText;
            articleHeadline = washingtonPostRes.articleHeadline;
            break;
        case 'latimes.com':
            const laTimesRes = await latimes(url);
            articleText = laTimesRes.articleText;
            articleHeadline = laTimesRes.articleHeadline;
            break;
        case 'theathletic.com':
            const theAthleticRes = await theAthletic(url);
            articleText = theAthleticRes.articleText;
            articleHeadline = theAthleticRes.articleHeadline;
            break;
        case 'businessinsider.com':
            const businessInsiderRes = await businessInsider(url);
            articleText = businessInsiderRes.articleText;
            articleHeadline = businessInsiderRes.articleHeadline;
            break;
        case 'bloomberg.com':
            const bloombergRes = await bloomberg(url);
            articleText = bloombergRes.articleText;
            articleHeadline = bloombergRes.articleHeadline;
            break;
        case 'vogue.com':
            const vogueRes = await vogue(url);
            articleText = vogueRes.articleText;
            articleHeadline = vogueRes.articleHeadline;
            break;
        case 'theatlantic.com':
            const atlanticRes = await atlantic(url);
            articleText = atlanticRes.articleText;
            articleHeadline = atlanticRes.articleHeadline;
            break;
        case 'forbes.com':
            const forbesRes = await forbes(url);
            articleText = forbesRes.articleText;
            articleHeadline = forbesRes.articleHeadline;
            break;
        default:
            articleText = 'No article found';
            articleHeadline = '404';
    }
    return {articleText, articleHeadline};
}

module.exports = {
    getContent,
}
