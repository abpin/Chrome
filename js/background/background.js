var isActive = false;
var sessionManager = null;
var sharedKrake = null;

/***************************************************************************/
/*********************  Incoming Request Handler  **************************/
/***************************************************************************/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    switch(request.action){
      case "update_url":
   
      break;

      case "load_script":
        loadScript(request.params.filename);
      break;

      case "get_session":
        sendResponse({ session: sessionManager });
      break;

      case "add_column":
        addColumn(request.params, sendResponse);
      break;

      case "delete_column":
        deleteColumn(request.params, sendResponse);
      break;

      case 'edit_current_column':
        editCurrentColumn(request.params, sendResponse);
      break;

      case 'match_pattern':
        alert("match_pattern");
        matchPattern(sendResponse);
      break;
    }//eo switch
  });

/***************************************************************************/
/************************  Browser Action Icon  ****************************/
/***************************************************************************/
var handleIconClick = function handleIconClick(tab){
   if(isActive){
     disableKrake();
     updateBrowserActionIcon();
     isActive = false;
     clearCache();

   }else{
     enableKrake();
     updateBrowserActionIcon();
     isActive = true;
     sessionManager = new SessionManager();
     sharedKrake = SharedKrake.getInstance();
   }

};//eo handleIconClick

var updateBrowserActionIcon = function(tab){
  isActive?
    chrome.browserAction.setIcon({path:"images/krake_icon_disabled_24.png"}):
    chrome.browserAction.setIcon({path:"images/krake_icon_24.png"}); 
};//eo updateBrowserActionIcon


chrome.browserAction.onClicked.addListener(handleIconClick);

/***************************************************************************/
/**************************** Action Methods  ******************************/
/***************************************************************************/
var enableKrake = function(){
  chrome.tabs.getSelected(null, function(tab){
    chrome.tabs.sendMessage(tab.id, { action : "enable_krake"}, function(response){} );
  });  
};//eo enableKrake

var disableKrake = function(){
  chrome.tabs.getSelected(null, function(tab){
    chrome.tabs.sendMessage(tab.id, { action : "disable_krake"}, function(response){} );
  });  
};//eo disableKrake

var clearCache = function(){
  var sharedKrake = null;
  var sessionManager = null;
};


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    //re-render panel using columns objects from storage if any. 
});

var loadScript = function(filename){
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.executeScript(tab.id, {file: filename}, function(){
      chrome.tabs.sendMessage(tab.id, { action: "load_script_done", params: { filename: filename } }, function(response){
        
      });
    });
  });
};//eo loadScript

var addColumn = function(params, callback){
  try{
    console.log('-- before "addColumn"');
    console.log( JSON.stringify(sessionManager) );

    sessionManager.currentColumn = ColumnFactory.createColumn(params);
    sessionManager.goToNextState();

    console.log('-- after "addColumn"');
    console.log( JSON.stringify(sessionManager) );
       
    if (callback && typeof(callback) === "function")  
      callback({status: 'success', session: sessionManager});  
  }catch(err){
    concole.log(err);
    if (callback && typeof(callback) === "function")  callback({status: 'error'}); 
  }
};//eo addColumn

var deleteColumn = function(params, callback){
  try{
    console.log('-- before "deleteColumn"');
    console.log( JSON.stringify(sessionManager) );

    if(sessionManager.currentColumn.columnId == params.columnId){
      sessionManager.currentColumn = null;
      sessionManager.goToNextState('idle');
    }else{
      SharedKrakeHelper.removeColumnFromSharedKrake(params.columnId);
    }//eo if-else

    console.log('-- after "deleteColumn"');
    console.log( JSON.stringify(sessionManager) );

    if (callback && typeof(callback) === "function")  
      callback({status: 'success', session: sessionManager}); 
  }catch(err){
    concole.log(err);
    if (callback && typeof(callback) === "function")  callback({status: 'error'}); 
  }
};//eo deleteColumn

/*
 * @Param: params:object { attribute:"xpath_1", values:params } 
 */
var editCurrentColumn = function(params, callback){
  try{
    console.log('-- editCurrentColumn attribute := ' + params.attribute);
    console.log('-- before "editCurrentColumn"');
    console.log( JSON.stringify(sessionManager) );
   
    switch(params.attribute){
      case 'xpath_1':
        sessionManager.currentColumn.setSelection1(params.values);
        sessionManager.goToNextState().goToNextState(); //current state := 'pre_selection_2'
      break;

      case 'xpath_2':
        sessionManager.currentColumn.setSelection2(params.values);
        sessionManager.goToNextState(); //current state := 'post_selection_2'
      break;
    }//eo switch
    
    console.log('-- after "editCurrentColumn"');
    console.log( JSON.stringify(sessionManager) );

    if (callback && typeof(callback) === "function")  
      callback({status: 'success', session: sessionManager}); 
  }catch(err){
    console.log(err);
    if (callback && typeof(callback) === "function")  callback({status: 'error'});
  }
};//eo editCurrentColumn

var matchPattern = function(callback){
  try{
    var result = PatternMatcher.findGenericXpath(sessionManager.currentColumn.selection1, sessionManager.currentColumn.selection2);
    if(result.status == 'success'){
      sessionManager.currentColumn.genericXpath = result.genericXpath;
      //tell content script to highlight all elements covered by generic xpath
    }else{
      //notify user
    }
    console.log("-- matchPattern result");
    console.log( JSON.stringify(result) );
  }catch(err){
    console.log(err);
  }
}





