// Time-stamp: <2023-02-17T09:02:34Z>
// ==UserScript==
// @name           Amazon Wishlist Aux Price JP
// @description	   Add marketplace price to wishlist in amazon.co.jp.
// @namespace      http://jrf.cocolog-nifty.com/
// @include        https://www.amazon.co.jp/hz/wishlist/ls/*
// @include        https://www.amazon.co.jp/hz/wishlist/genericitemsPage/*
// @include        https://www.amazon.co.jp/registry/wishlist/*
// @include        https://www.amazon.co.jp/gp/registry/wishlist*
// @version        0.05
// ==/UserScript==

var TIMEOUT_ID = null;
var AWAP_WAIT = 500;

function inScreen (x) {
  let screenHeight = window.outerHeight;
  let x_height = x.offsetHeight;
  let x_offsetY = x.getBoundingClientRect().top;
  let x_position = x_offsetY - screenHeight;
  return (- screenHeight <= (x_position + x_height) && x_position < 0);
}

function getASINfromLI (li) {
  let h3 = li.getElementsByTagName('h3')[0];
  if (! h3) {
    h3 = li.getElementsByTagName('h2')[0];
  }
  if (! h3) return null;
  let a = h3.getElementsByTagName('a')[0];
  if (! a) return null;
  if (a.href.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN)\/([^\/\?\&]+)/)) {
    return RegExp.$1;
  }
  return null;
}

function parsePrice(dom, asin, target) {
  console.log("awap: parsePrice " + asin);
  let x = dom.getElementById("buybox");
  let pt = null;
  let mprice = null;
  if (! x) {
    console.log("awap: No buybox " + asin);
  } else {
    let l = x.getElementsByClassName("a-row");
    for (let i = 0; i < l.length; i++) {
      let y = l[i];
      if (y.innerHTML.match(/>\s*(?:獲得(?:予定)?)?ポイント\s*[\:：]\s*(?:<\/span>(?:\s*<\/div>\s*<div[^>]+>)?)?\s*<span\s+[^>]*class=\"a-color-price[^\"]*\"\s*[^>]*>([^<]+)/)) {
	pt = RegExp.$1;
	break;
      }
    }
  }

  if (! pt) {
    x = dom.getElementById("buybox");
    if (x) {
      x = x.getElementsByClassName("loyalty-points")[0];
      if (x) {
	x = x.getElementsByClassName("a-color-price")[0];
	if (x) {
	  pt = x.textContent;
	}
      }
    }
  }

  x = dom.getElementById("tmmSwatches");
  if (! x) {
    console.log("awap: No tmmSwatches " + asin);
  } else {
    let y = x.getElementsByClassName("selected")[0];
    if (y) {
      x = y;
    }
    y = x.getElementsByClassName("olp-used")[0]
      || x.getElementsByClassName("olp-new")[0];
    if (y) {
      y = y.getElementsByTagName("a")[0];
      if (y) {
	mprice = y.outerHTML;
      }
    }
  }

  if (! mprice) {
    x = dom.getElementById("twister");
    if (x) {
      let y = x.querySelector('.top-level.selected-row');
      if (y) {
	x = y;
      }
      let l = x.getElementsByClassName("dp-used-col");
      if (l.length == 0) {
	l = x.getElementsByClassName("dp-new-col");
      }
      for (let i = 0; i < l.length; i++) {
	let y = l[i].getElementsByTagName("a")[0];
	if (y) {
	  mprice = y.outerHTML;
	  break;
	}
      }
    }
  }

  if (! mprice) {
    x = dom.getElementById("olp_feature_div");
    if (x) {
      let y = x.getElementsByClassName("a-color-price")[0];
      if (y) {
	mprice = '<span class="a-color-price">' + y.textContent + '</span>';
      }
    }
  }

  if (! mprice) {
    x = dom.getElementById("buyNew_noncbb");
    if (x) {
      mprice = '<span class="a-color-price">' + x.textContent + '</span>';
    }
  }
  
  let s = "";
  if (pt) {
    s += '<span class="a-color-price">' + pt + '</span>';
  }
  if (mprice) {
    s += mprice;
  }
  target.className = 'awap-price a-row a-size-small awap-processed';
  target.innerHTML = s;
}

function addAwap () {
  let gitems = document.querySelectorAll("#g-items li");
  for (let i = 0; i < gitems.length; i++) {
    let li = gitems[i];
    let x = li.getElementsByClassName("g-item-details")[0];
    if (x && inScreen(x)) {
      let y = x.getElementsByClassName("awap-price");
      if (y[0] && y[0].classList.contains('awap-processed')) continue;
      if (y[0]) {
	y[0].parentNode.removeChild(y[0]);
      }
      let div = document.createElement('div');
      div.className = 'awap-price a-row a-size-small';
      let asin = getASINfromLI(li);
      if (! asin) {
	console.log("awap: null asin");
	continue;
      }
      x.appendChild(div);
      let xhr = new XMLHttpRequest();
      xhr.responseType = "document";
      xhr.onload = (function (e) {parsePrice(e.target.responseXML,
					     this.asin, this.div);})
	.bind({div: div, asin: asin});
      xhr.onerror = (function (e) {
	this.div.parentNode.removeChild(this.div);
	console.log("awap: xhr error " + this.asin);
      }).bind({div: div, asin: asin});
      xhr.open("get", "http://www.amazon.co.jp/dp/" + asin + "/");
      xhr.send();
    }
  }
}

function scrolled () {
  if (TIMEOUT_ID) {
    window.clearTimeout(TIMEOUT_ID);
  }
  TIMEOUT_ID = window.setTimeout(addAwap, AWAP_WAIT);
}  

window.addEventListener('load', scrolled);
window.addEventListener('scroll', scrolled);

console.log("awap: GM load Ok");
