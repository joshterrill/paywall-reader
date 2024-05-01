# Paywall Reader

A web app that lets you read articles on popular news sites that get hidden behind paywalls.

URL: https://reader.dangerous.dev

### Supported Sites
* New York Times (nytimes.com)
* New York Times Cooking (cooking.nytimes.com)
* The New Yorker (newyorker.com)
* The Economist (economiste.com)
* Washington Post (washingtonpost.com)
* LA Times (latimes.com)
* The Athletic (theathletic.com)
* Business Insider (businessinsider.com)
* Bloomberg (bloomberg.com)
* Vogue (vogue.com)
* The Atlantic (theatlantic.com)
* Forbes (forbes.com)
* Wired (wired.com)

### Prerequisites

1. Register a custom Google search engine by going to https://developers.google.com/custom-search/v1/introduction and pressing "Get A Key"
2. As per their site:

>Once it is created, you can find the engine's ID in the Setup > Basics > Search Engine ID section of the Control Panel

This is where you will configure what sites your search will search in. For the purposes of this app in its current state, we will just use bloomberg.com (`*.bloomberg.com/*`) and newyorker.com (`*.newyorker.com/*`)

Take note of your API key and Search Engine ID.

### Installation

```bash
git clone https://github.com/joshterrill/paywall-reader
cd paywall-reader/
cp .env.example .env
# replace GOOGLE_API_KEY and GOOGLE_SEARCH_ID with values from prerequisites section
npm i
npm start
```

Running `npm test` will check all supported sites for output verification, making sure that the selectors that extract the text from the sites have not changed.

### Adding More Sites

Pull requests would gladly be accepted for adding support for more sites. If you can't submit a pull request, open a [Github issue](https://github.com/joshterrill/paywall-reader/issues) and I'll get to it when I have time.

### Todo
* Fix relative and absolute links in embedded html to point to domain they should be coming from
* Add dom sanitization for incoming HTML
* Add checks for source and URL fields on requests to ensure the URL matches the URL in the `news-source-map.json` file
