const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const { engine } = require('express-handlebars');
const parse = require('./parser');
const newsSourceMapping = require('./news-source-map.json');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended: true}));
app.use(express.static(`${__dirname}/public`));

app.engine('handlebars', engine({
    helpers: {
        block: (name, options) => {
            const context = options.data.root;
            context._blocks = context._blocks || {};
            context._blocks[name] = options.fn(context);
            return null;
        },
        contentFor: (name, options) => {
            const context = options.data.root;
            return (context._blocks && context._blocks[name]) || '';
        },
    },
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/article', (req, res) => {
    const { source } = req.query;
    const sourceText = newsSourceMapping[source];
    if (!sourceText || !sourceText.name) {
        res.render('404');
    }
    res.render('article', {source, sourceText: sourceText.name});
});

app.get('/read', async (req, res) => {
    try {
        let { source, url } = req.query;
        if (!source || !url) {
            throw new Error('Source or URL not provided');
        }
        const sourceMapping = newsSourceMapping[source];
        let foundArticle = false;
        for (let method of sourceMapping.method) {
            try {
                let { articleText, articleHeadline } = await parse.getContent(source, url, method);
                articleText = parse.formatArticleText(articleText, req.headers['x-forwarded-proto'] || req.protocol);
                foundArticle = true;
                res.render('read', {source, sourceText: newsSourceMapping[source].name, articleText, articleHeadline});
            } catch (error) {
                // nasty hack to see if the error is due to a trailing slash
                if (error && url.endsWith('/')) {
                    url = url.slice(0, -1);
                    let { articleText, articleHeadline } = await parse.getContent(source, url, method);
                    articleText = parse.formatArticleText(articleText, req.headers['x-forwarded-proto'] || req.protocol);
                    foundArticle = true;
                    res.render('read', {source, sourceText: newsSourceMapping[source].name, articleText, articleHeadline});
                }
                console.log('Error parsing article:', error);
            }
        }
        if (!foundArticle) {
            throw new Error('No article found');
        }
    } catch (error) {
        console.log(error);
        res.render('article-not-found');
    }
    
});

app.get('/*', (req, res) => {
    res.render('404');
});

app.listen(port, () => {
    console.log(`Listening on host: http://localhost:${port}`);
});