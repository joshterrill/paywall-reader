# Paywall Reader

A web app that lets you read articles on popular news sites that get hidden behind paywalls.

### Supported Sites
* New York Times (nytimes.com)
* New York Times Cooking (cooking.nytimes.com)
* The New Yorker (newyorker.com)
* The Economist (economiste.com)
* Washington Post (washingtonpost.com)
* Vogue (vogue.com)

### Unsupported Sites
* Wall Street Journal (wsj.com)

### Installation

```bash
git clone https://github.com/joshterrill/paywall-reader
cd paywall-reader/
npm i
npm start
```

Running `npm test` will check all supported sites for output verification, making sure that the selectors that extract the text from the sites have not changed.

### Adding More Sites

Pull requests would gladly be accepted for adding support for more sites (as long as they are not sites already listed in the **Unsupported Sites** section). If you can't submit a pull request, open a [Github issue](https://github.com/joshterrill/paywall-reader/issues) and I'll get to it when I have time.

### Todo
* Fix relative links in embedded html to point to domain they should be coming from