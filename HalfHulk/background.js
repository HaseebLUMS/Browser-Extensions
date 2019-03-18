//Add Listner to web request and observe changes
//Add Listner to management and try to uninstall
//Add Listner to tabs and observe replacing or removing of tab
//Add Listner to history and observe changes
//Add Listner to windows
// format of http-headers: [{key1:val1}, {...}, {...}, ...]


console.log("Doing...")
ext_pages 	  = []
headers_store     = {}	//{requestId1:[http-headers1], requestId2:[http-headers2], ...}
parameters_store  = {} //{requestId1:[url-parameters], requestId2:[url-parameters], ...}
_alert  	  = "\n\nALERT\n"
_hdr_rm 	  = "----------Headers Removed"
_hdr_ad 	  = "++++++++++ New Headers Added"
_hdr_ch		  = "!=!=!=!=!=!=!= Headers Changed"
_hdr_hp		  = ":) :) :) :) :)HAPPY HAPPY Headers"
_prm_ch		  = "!=!=!=!=!=!=!= Parameters Changed"
_info   	  = "***********(i)"
toListen          = [[chrome.tabs.onReplaced,"chrome.tabs.onReplaced"],
		    [chrome.management.onInstalled, "chrome.management.onInstalled"],
		    [chrome.management.onUninstalled, "chrome.management.onUninstalled"],
		    [chrome.history.onVisitRemoved, "chrome.history.onVisitRemoved"]]



// A utility function, takes two headers and checks for any differences
let validateHeaders = function(stored_headers, new_headers){
	if (stored_headers.length != new_headers.length){
		if (stored_headers.length > new_headers.length){console.log(_alert, _hdr_rm);}
		else {console.log(_alert, _hdr_ad);}
	}
	else if(JSON.stringify(stored_headers) != JSON.stringify(new_headers)){//code performance alert
		//Identifying Which Header Changed
		for(i = 0; i< stored_headers.length; i++){
			_name = stored_headers[i]['name']
			_value = stored_headers[i]['value']
			for(j = 0; j< new_headers.length; j++){
				if(_name == new_headers[j]['name'] && _value != new_headers[j]['value']){ //condition order optimized for performance
					console.log(_alert, _hdr_ch, "name: ", _name, "changed value: ", new_headers[j]['value'])
				}
			}
		}
	}
	else console.log( _hdr_hp);
}


// Called when headers are received, and stores them for future references
let headersReceived = function(){
	//console.log('headersReceived', arguments)
	headers_store[arguments[0].requestId] = arguments[0].responseHeaders
};


//Called when a web request is fully processed, it then checks the headers against previously stored headers
let completed = function(){
	//console.log('completed', arguments)
	if(headers_store[arguments[0].requestId]){
		validateHeaders(headers_store[arguments[0].requestId], arguments[0].responseHeaders)
	}
};


//Stores URL before the request is supplied to any extensions
let beforeSendHeaders = function(){
	//console.log('beforeSendHeaders')
	parameters_store[arguments[0].requestId] = arguments[0].url
};


//Called when request is processed by extensions, then it checks the URL against stored URL
let sendHeaders = function(){
	//console.log('sendHeaders')
	if(parameters_store[arguments[0].requestId] != arguments[0].url){
		console.log(_alert, _prm_ch, "old: ", parameters_store[arguments[0].requestId], " modified: ", arguments[0].url)
	}
};


// Called when any of the event listed in toListen is triggered
let listener = function(){
	console.log('triggered', arguments)
};


//checks if extension management page is open or not, if not then it opens one
//it is for checking mal behavior of extensions; whether they are forcing this
//specific page to be closed
let addExtPage = function(tabs){
	console.log("All Tabs")
	console.log(tabs)
	ext_page_present = false
	for(i = 0; i<= tabs.length; i++){
		if(i == tabs.length){
			chrome.tabs.create({url: 'chrome://extensions/'})
			console.log("navigated chrome://extensions page")
		}

		else if(tabs[i].url == 'chrome://extensions/'){
			console.log("Already there (chrome://extensions)")
			break
		}
	}

	//Now Adding listener to ext pages; whether any one is trying to close 'em.
	chrome.tabs.getAllInWindow(function(newTabs){
		for(j = 0; j < newTabs.length; j++){
			if(newTabs[i].url = 'chrome://extensions/'){
				ext_pages.push(newTabs[i].id)
			}
		}
	})

}


var main = function(){
	for (i = 0; i < toListen.length; i++){
		toListen[i][0].addListener(listener);
		console.log('Listening', toListen[i][1], "...");
	}

	chrome.tabs.getAllInWindow(addExtPage);
	chrome.webRequest.onHeadersReceived.addListener(headersReceived, {urls: ['<all_urls>']}, ['responseHeaders']);
	chrome.webRequest.onCompleted.addListener(completed, {urls: ['<all_urls>']}, ['responseHeaders']);
	chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, {urls: ['<all_urls>']});
	chrome.webRequest.onSendHeaders.addListener(sendHeaders, {urls: ['<all_urls>']});


	chrome.tabs.onRemoved.addListener((id) => {
		if (ext_pages.includes(id)){
			console.log(_alert, "chrome://extensions page being forcefully removed.")
		}
	});


	//not common | need to see this more | not clear
	chrome.tabs.onReplaced.addListener((new_id, old_id) => {
		if(ext_pages.includes(old_id)){
			console.log(_alert, "chrome://extensions page being forcefully replaced.")
		}
	});

}();


//Design Decision: 
//1) Make a generic listener function for all events
//and take action accordingly (by if else statements)
//2) Make a speific funcion for each event
// Goal: Print critical info of each event; the critical info varies for each event.
//
// Going with 1 will incur a performance overhead as it will be 
// exessivley used funtion and many if else statements will be
// computed for taking any specific action.
// Going with 2 will avoid this overhead and for each event a specific function 
// will be called.

//Muhammad Haseeb
