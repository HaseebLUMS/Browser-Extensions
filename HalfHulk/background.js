//Add Listner to web request and observe changes
//Add Listner to management and try to uninstall
//Add Listner to tabs and observe replacing or removing of tab
//Add Listner to history and observe changes
//Add Listner to windows
// format of http-headers: [{key1:val1}, {...}, {...}, ...]

console.log("Doing...")
toListen          = [[chrome.tabs.onRemoved,"chrome.tabs.onRemoved"],
			[chrome.tabs.onReplaced,"chrome.tabs.onReplaced"],
			[chrome.management.onInstalled, "chrome.management.onInstalled"],
			[chrome.management.onUninstalled, "chrome.management.onUninstalled"],
			[chrome.history.onVisitRemoved, "chrome.history.onVisitRemoved"]]
headers_store     = {}	//{requestId1:[http-headers1], requestId2:[http-headers2], ...}
parameters_store  = {} //{requestId1:[url-parameters], requestId2:[url-parameters], ...}
_alert  		  = "\n\nALERT\n"
_hdr_rm 		  = "----------Headers Removed"
_hdr_ad 		  = "++++++++++ New Headers Added"
_hdr_ch			  = "!=!=!=!=!=!=!= Headers Changed"
_hdr_hp			  = ":) :) :) :) :)HAPPY HAPPY Headers"
_info   		  = "***********(i)"





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


	else console.log(_alert, _hdr_hp)
}


let listener = function(){
	console.log('triggered', arguments)
};

let headersReceived = function(){
	console.log('headersReceived', arguments)
	headers_store[arguments[0].requestId] = arguments[0].responseHeaders
};

let completed = function(){
	console.log('completed', arguments)
	if(headers_store[arguments[0].requestId]){
		validateHeaders(headers_store[arguments[0].requestId], arguments[0].responseHeaders)
	}
};

var main = function(){
	for (i = 0; i < toListen.length; i++){
		toListen[i][0].addListener(listener);
		console.log('Listening', toListen[i][1], "...");
	}

	chrome.webRequest.onHeadersReceived.addListener(headersReceived, {urls: ['<all_urls>']}, ['responseHeaders']);
	chrome.webRequest.onCompleted.addListener(completed, {urls: ['<all_urls>']}, ['responseHeaders']);
}();
