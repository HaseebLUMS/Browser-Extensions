//Add Listner to web request and observe changes
//Add Listner to management and try to uninstall
//Add Listner to tabs and observe replacing or removing of tab
//Add Listner to history and observe changes
//Add Listner to windows
// format of http-headers: [{key1:val1}, {...}, {...}, ...]


console.log("Doing...")
sws_info		  = [] // sws are all software in this context, {extensions, apps, themes}
ext_pages 		  = []
headers_store     = {} //{requestId1:[http-headers1], requestId2:[http-headers2], ...}
req_headers		  = {} //{requestId1:[http-headers1], requestId2:[http-headers2], ...}
parameters_store  = {} //{requestId1:[url-parameters], requestId2:[url-parameters], ...}
_alert  		  = "\n\nALERT\n"
_hdr_rm 		  = "----------Headers Removed"
_hdr_ad 		  = "++++++++++ New Headers Added"
_hdr_ch			  = "!=!=!=!=!=!=!= Headers Changed"
_hdr_hp			  = ":) :) :) :) :)HAPPY HAPPY Headers"
_prm_ch			  = "!=!=!=!=!=!=!= Parameters Changed"
_info   		  = "***********(i)"
_avoid_page		  = "https://www.facebook.com/"



// A utility function, takes two headers and checks for any differences
let validateHeaders = function(stored_headers, new_headers, t){ //t = 1 => response headers, t = 2 => request headers
	

	if (stored_headers.length != new_headers.length){
		if(t == 1){console.log(_info, "For response headers")}
		else if (t == 2){console.log(_info, "For request headers")}
		if (stored_headers.length > new_headers.length){
			console.log(_alert, _hdr_rm);
		}
		else {console.log(_alert, _hdr_ad);}
	}
	else if(JSON.stringify(stored_headers) != JSON.stringify(new_headers)){//code performance alert
		//Identifying Which Header Changed
		for(i = 0; i< stored_headers.length; i++){
			_name = stored_headers[i]['name']
			_value = stored_headers[i]['value']
			for(j = 0; j< new_headers.length; j++){
				if(_name == new_headers[j]['name'] && _value != new_headers[j]['value']){ //condition order optimized for performance
					if(t == 1){console.log(_info, "For response headers")}
					else if (t == 2){console.log(_info, "For request headers")}
					console.log(_alert, _hdr_ch, "name: ", _name, "changed value: ", new_headers[j]['value'])
				}
			}
		}
	}
	//else console.log( _hdr_hp);
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
		validateHeaders(headers_store[arguments[0].requestId], arguments[0].responseHeaders, 1)
	}
};


//Stores URL before the request is supplied to any extensions
let beforeSendHeaders = function(){
	//console.log('beforeSendHeaders')
	parameters_store[arguments[0].requestId] = arguments[0].url
	req_headers[arguments[0].requestId] = arguments[0].requestHeaders
};


//Called when request is processed by extensions, then it checks the URL against stored URL
let sendHeaders = function(){
	if(req_headers[arguments[0].requestId]){
		validateHeaders(req_headers[arguments[0].requestId], arguments[0].requestHeaders, 2)
	}
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
			chrome.tabs.create({url: _avoid_page})
			console.log("navigated", _avoid_page ,"page")
		}

		else if(tabs[i].url.includes(_avoid_page)){
			console.log("Already there (",_avoid_page,")")
			break
		}
	}

	//Now Adding listener to ext pages; whether any one is trying to close 'em.
	chrome.tabs.getAllInWindow((newTabs) =>{
		for(j = 0; j < newTabs.length; j++){
			if(newTabs[j].url.includes(_avoid_page)){
				ext_pages.push(newTabs[j].id)
			}
		}
	});

}


var main = function(){

	//Storing all installed SWs in sws_info (a global var)
	chrome.management.getAll(installedSWs =>{
		installedSWs.forEach(sw => {sws_info.push(sw)})
		console.log(sws_info)
	});


	setTimeout(3000, chrome.tabs.getAllInWindow(addExtPage));
	chrome.webRequest.onHeadersReceived.addListener(headersReceived, {urls: ['<all_urls>']}, ['responseHeaders']);
	chrome.webRequest.onCompleted.addListener(completed, {urls: ['<all_urls>']}, ['responseHeaders']);
	chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, {urls: ['<all_urls>']});
	chrome.webRequest.onSendHeaders.addListener(sendHeaders, {urls: ['<all_urls>']});


	//Checking if any extension is avoiding chrome://extensions page
	chrome.tabs.onRemoved.addListener((id) => {
		if (ext_pages.includes(id)){
			console.log(_alert, _avoid_page," page being forcefully removed.")
		}
	});


	//not common | need to see this more | not clear
	chrome.tabs.onReplaced.addListener((new_id, old_id) => {
		if(ext_pages.includes(old_id)){
			console.log(_alert, _avoid_page,"page being forcefully replaced.")
		}
	});


	//checking whether any extension is installing something
	chrome.management.onInstalled.addListener(info => {
		console.log(_alert, "A new extension/app/theme installed, name: " +
		info.name, " description: ", info.description)
		sws_info.push(info) //A new SW got installed, so storing it in sws_info
	});


	//checking whether any extension is un-installing something
	chrome.management.onUninstalled.addListener(rm_id => {
		sws_info.forEach(sws => {
			if(sws.id == rm_id){
				console.log(_alert, "An extension/app/theme got Un-installed," +
				"name:, ", sws.name,  "description: ", sws.description);
			}
		});
	});


	//checking whether any extension is manipulating history
	chrome.history.onVisitRemoved.addListener(rm => {
		console.log(_alert, "History is being removed.", rm)
	})

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
// Going with 2 will avoid this overhead and for each event a specific callback function 
// will be called.

//Muhammad Haseeb
