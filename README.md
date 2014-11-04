GitHub™ Recruiter
================

Recruiting tool that searches the persons that got involved with some particular GitHub™ repos of yours. Find those people that starred, watched or contributed to any project of yours.

The intention of this application is to be used as an open source tool for recruitng.

You can see the work in progress [here](http://farolfo.github.io/github-recruiter/app/index.html#/search/repository)

###Basic Usage

1. Go to http://farolfo.github.io/github-recruiter/app/index.html#/search/repository, (to reduce the number of calls that you do we encourage the usage of the _search by repository_ instead of _by organization_, which produces many more calls than the other mode).
2. Type your GitHub™'s organization name and the repo that you want to analyze. It is important to note that only _public repos_ will work for now (think that doing this analysis in a private repo does not make much sense cause the people that contributed there probably are already working for you).
3. Wait a bit and you will see the candidates that the GitHub™ Recruiter shows you. If they provide their name in their public GitHub™'s data, you will see a link to his Linkedin as well.

Take into account that the number of calls to the GitHub™ API are limited per day so if you have no answers from the GitHub™ Recruiter after hiting _search_ and waiting a long time, this might be the case. A proper error message will come soon, for now [open the browser dev console](https://developer.chrome.com/devtools/docs/console#opening-the-console) to check this.

## TODO
* Improve error handling
* Add filters (i.e.: not to display the people that already belongs to my org, filter by location)
* Fix style
* Build backend API, for now it is all made in client side
* Integration with jobvite
* About page
* User ranking (find a way to valuate a _commit_ or contribution to an opensource project and then rank users) !!!!!!!

## Notice

All trademarks, service marks, and copyrights are property of their respective owners. GitHub® is a registered trademark of the GitHub Inc.

## License
(The MIT License)

Copyright (c) 2014 Franco Arolfo < francoarolfo at hotmail.com >

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


