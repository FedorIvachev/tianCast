var search_arr = [];
var seriesName = [];
var seriesImg = [];
var seriesImgSmall = [];
var seriesAudio = [];
var seriesLength = [];
var place = 0;
var is_playing = 1;
var db;
var subDb;
var audio_queue = [];
var subid_;
var subimage_;
var link2 = [];





window.onload = function() {
	init();
	init_db();
	init_subsriptions_db();
	get_last_episode_inf();
	var indicator = document.getElementById('indicator');
	indicator.style.visibility = 'hidden';
	var indicator1 = document.getElementById('indicator1');
	indicator1.style.visibility = 'hidden';
};

var init = function () {
	// add eventListener for tizenhwkey
	document.addEventListener('tizenhwkey', function(e) {
		if(e.keyName === 'back') {
			var page = document.getElementsByClassName('ui-page-active')[0];
			var pageid = page ? page.id : '';
			if (pageid === 'searchpod') {
				try {
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				history.back();
			}
		}
	});	
};

function onError( err ){
	console.log( err );
}

function getFeed2(num){
	getfeedfromRSS(link2[num], num + 100);
}


var init_subsriptions_db = function () {
	console.log("initting subs db");
	var subTitle_ = 'subs';
	var subVersion = 1.0;
	var subDbName = 'subsdb';
	var subDbDisplayName = 'subs_test_db';
	var subDbSize = 2 * 1024 * 1024;
	subDb = openDatabase(subDbName, subVersion, subDbDisplayName, subDbSize);
	if(!subDb){alert("Failed to connect to database.");}
};

function get_subs_list(){
	init_subsriptions_db();
	console.log("getting subs list");
	$('#subscriptionsList').html('');
	subDb.transaction(function(tx) {
		tx.executeSql('SELECT * FROM SubsData', [], function(tx, results) {
			console.log(results.rows.length);
			if (results.rows.length == 0) {
				alert("Search for podcasts to subscribe to them");
			}
			for (var cur = 0; cur < results.rows.length; cur++){
	    		$('div[data-role=collapsible]').collapsible();
				var subscriptiontitle = results.rows.item(cur)['subtitle'].substr(7, results.rows.item(cur)['subtitle'].length - 15);
				var subscriptionlink = results.rows.item(cur)['subid'];
				link2[cur] = subscriptionlink;
				console.log(subscriptionlink);
				$('#subscriptionsList').append('<button class="ui-btn" onclick="getFeed2(' + cur +')" text-overflow="ellipsis">' + subscriptiontitle + '</button>');
			}
		}, function (){
			alert("You have no subscriptions at the moment.");
		});
	});
};


//show the channel page, when came here from subscriptions list

function getfeedfromRSS(link, num) {
	console.log("getting feed from rss subscription");
	num += 100;
	location.href = "#channelRSS";
	var indicator = document.getElementById("indicator");
	indicator.style.visibility = "visible";
    var width = screen.width;
	var FEED_URL = link;
	subid_ = link;
	$("#rssChannelContent").html("");
	$.ajax({
	       type: "GET",
	        url: FEED_URL,
	        dataType: "xml",
	        success: xmlParser
	});
	function xmlParser(xml) {
		console.log(xml);
		indicator.style.display = "none";
		var cur = 0;
		$('#Channelinf').html('<div id="channelTitleRight"></div>');
		var channel_title = $(xml).find("title")[0];
		$('#channelTitleRight').html($(xml).find("title")[0]);
		
		is_subbed();
		
	    $(xml).find("item").each(function () {
	    	//console.log($(this).text());
	    	if (cur < 30) {
	    		var url =  $(this).find("enclosure").attr('url');
	    		$('div[data-role=collapsible]').collapsible();
	    		cur += 100;
	    		seriesName[cur] = $(this).find("title").text();
	    		seriesAudio[cur] = url;
	    		seriesImg[num] = $(this).find("image").attr("href"); // may not work, change the search text
	    		$("#rssChannelContent").append('<button class="ui-btn" onclick="getSeriesInf(' + 
	    				cur + ', ' + num + ')" text-overflow="ellipsis">' + 
	    				$(this).find("title").text() + '</button>');
		    	cur-=100;
	    	}
	    	cur++;
	    });
	}
	num -= 100;
}


var is_subbed = function(){
	console.log("checking if subbed...");
	$('#subscribeButton').html('<button class="ui-btn" id="subscribeBtn" onclick="addSubscription()">Subscribe</button>');
	subDb.transaction(function(tx) {
		tx.executeSql('SELECT * FROM SubsData WHERE subid=?', [subid_], function(tx, results) {
			if (results.rows.length) {
				console.log('Subbed.');
				$('#subscribeButton').html('<button class="ui-btn" id="unsubscribeBtn" onclick="deleteSubscription()">Unsubscribe</button>');
			} else {
				console.log('Not subbed');
				$('#subscribeButton').html('<button class="ui-btn" id="subscribeBtn" onclick="addSubscription()">Subscribe</button>');
			}
		}, onError);
	});
}


var delete_subDb = function(){
	console.log("trying to drop...");
	subDb.transaction(function(tx) {
		tx.executeSql('DROP TABLE SubsData', [], function(tx, results) {
			console.log("database dropped");
		}, onError);
	});
};


var deleteSubscription = function(){
	console.log("trying to drop subscription...");
	subDb.transaction(function(tx) {
		tx.executeSql('DELETE FROM SubsData WHERE subid = ?', [subid_], function(tx, results) {
			console.log("deleted subscription");
			$('#subscribeButton').html('<button class="ui-btn" id="subscribeBtn" onclick="addSubscription()">Subscribe</button>');
		}, onError);
	});
}


function addSubscription(){
	var subtitle_ =  $('#channelTitleRight').html();
	console.log(subtitle_);

	subDb.transaction(function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS SubsData (id INTEGER PRIMARY KEY AUTOINCREMENT, subid TEXT, subtitle TEXT, subimage TEXT)',
	                 [], function(sqlTransaction, sqlResultSet) {
			console.log('TizenCastData has been created.');
		}, function(sqlTransaction, sqlError) {
			alert('Starting the podcast from the previous position does not work, sorry for that');
		});
	}, function() {
		console.log('SQL statements were executed successfully.');
	});
	subDb.transaction(function(tx) {
		tx.executeSql('INSERT INTO SubsData (subid, subtitle, subimage) VALUES (?, ?, ?)', [subid_, subtitle_, subimage_], function(sqlTransaction, sqlResultSet) {
			$('#subscribeButton').html('<button class="ui-btn" id="unsubscribeBtn" onclick="deleteSubscription()">Unsubscribe</button>');
			console.log('added subscription');
		}, null);
	});
}




// playing from the last point thing
//__________________________________________________________________________________________________


var init_db = function () {
	var title_ = 'please work';
	var version = 1.0;
	var dbName = 'tizendb';
	var dbDisplayName = 'tizen_test_db';
	var dbSize = 2 * 1024 * 1024;
	db = openDatabase(dbName, version, dbDisplayName, dbSize);
	if(!db){alert("Failed to connect to database.");}
};

var delete_db = function() {
	console.log("trying to drop...");
	db.transaction(function(tx) {
		tx.executeSql('DROP TABLE TizenCastData', [], function(tx, results) {
			console.log("database dropped");
		}, onError);
	});
};


function setStartTime(podtitle_, podimage_, podaudio_, podtime_){
		db.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS TizenCastData' +
					'(id INTEGER PRIMARY KEY AUTOINCREMENT, podtitle TEXT, podimage Text, podaudio TEXT, podtime TEXT)',
		                 [], function(sqlTransaction, sqlResultSet) {
				console.log('TizenCastData has been created.');
			}, function(sqlTransaction, sqlError) {
				alert('Starting the podcast from the previous positin does not work, sorry for that');
			});
		}, function() {
			console.log('SQL statements were executed successfully.');
		});
		db.transaction(function(tx) {
			tx.executeSql('INSERT INTO TizenCastData (podtitle, podimage, podaudio, podtime) VALUES (?, ?, ?, ?)', 
					[podtitle_, podimage_, podaudio_, podtime_], function(sqlTransaction, sqlResultSet) {
				console.log('added your time');
			}, null);
		});
}

function updateStartTime(podtime_){
	db.transaction(function(tx) {
		tx.executeSql('UPDATE TizenCastData SET podtime =' + podtime_ + ' WHERE id = 1', [], {}, null);
	});
}


var get_last_episode_inf = function (){
	db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM TizenCastData', [], function(tx, results) {
			$("#PodcasterName").html(results.rows.item(0)['podtitle']);
			$("#PodcasterImg").html('<img width=90% src="' + results.rows.item(0)['podimage'] + '"/>');			
			document.getElementById('episodeAudio').style.visibility = 'visible';
			document.getElementById('episodeAudio').src = results.rows.item(0)['podaudio'] + '#t=' + results.rows.item(0)['podtime'];
			document.getElementById('episodeAudio').load();
			$("#dButton").show();
			set_last_episode_time(results.rows.item(0)['podtime']);
		}, function(){
			document.getElementById('episodeAudio').style.visibility = 'hidden';
		});
	});
};

var set_last_episode_time = function (podtime_){
	var music = document.getElementById('episodeAudio');
	music.addEventListener("timeupdate", function() {
		updateStartTime(music.currentTime);
	}, true);
};


function searchiTunes(){
	var indicator1 = document.getElementById("indicator1");
	indicator1.style.visibility = "visible";
	var FEED_URL = "https://itunes.apple.com/search?term=" + 
	document.getElementById('searchplace').value.replace(/ /g, '+') + "&entity=podcast";
    $("#searchContent").html("");
	$(document).ready(function () {
	    request = $.ajax({
	        type: "get",
	        dataType: 'json',
	        url: FEED_URL,
	        success: function (data) {
	            console.log(data);   
	        }
	    });
	    request.done(function (response, textStatus, jqXHR){
	    	console.log(response);
			indicator1.style.display = "none";
	        // Log a message to the console
	        //console.log("Hooray, it worked!");
			if (response['resultCount'] == 0) {
				alert('Nothing found');
			}
	        for (var cur = 0; cur < response['resultCount']; cur++) {
		        //console.log(response['results'][cur]['trackViewUrl']);
		        search_arr[cur] = response['results'][cur]['feedUrl'];
		        $("#searchContent").append('<div class = "search_item" data-theme="b" onclick="getPodcastRSS(' + cur + ')">'+
		        						   		'<div class = "search_image">' +
		        						   			'<img class = "search_image_img" src=' + response['results'][cur]['artworkUrl100'] + '/>' +
		        						   		'</div>' +
		        						   		'<div class="search_title">' +
		        						   			'<div class="search_title_text">' + 
		        						   			response['results'][cur]['collectionName'] + '</div></div>' +
		        						   	'</div>');
		        seriesImg[cur] = response['results'][cur]['artworkUrl600'];
		        seriesImgSmall[cur] = response['results'][cur]['artworkUrl100'];
	        }
	        
	    });
	    request.fail(function (jqXHR, textStatus, errorThrown){
	        // Log the error to the console
	        console.error(
	            "The following error occurred: "+
	            textStatus, errorThrown
	        );
	    });
	});
}
function getPodcastRSS(num){
	var FEED_URL = search_arr[num];
	getFeed(search_arr[num], num);
	
}



// GET SERIES FEED
function getFeed(link, num){
	location.href = "#channelRSS";
	var indicator = document.getElementById("indicator");
	indicator.style.visibility = "visible";
    var width = screen.width;
	var FEED_URL = link;
	subid_ = link;
	$("#rssChannelContent").html("");
	$.ajax({
		       type: "GET",
		        url: FEED_URL,
		        dataType: "xml",
		        success: xmlParser
		});
		function xmlParser(xml) {
			//console.log(xml);
			indicator.style.display = "none";
			var cur = 0;
			$('#Channelinf').html('<div class = "search_item" data-theme="b">'+
			   							'<div class = "search_image">' +
			   									'<img class = "search_image_img" src=' + seriesImgSmall[num] + '/>' +
			   							'</div>' +
			   							'<div class="search_title">' +
			   								'<div class="podcast_title_text" id="channelTitleRight"></div></div>' +
		   						'</div>');
			//console.log($(xml).find("title")[0]);
			var channel_title = $(xml).find("title")[0];
			$('#channelTitleRight').html($(xml).find("title")[0]);
			
			is_subbed();
			
		    $(xml).find("item").each(function () {
		    	//console.log($(this).text());
		    	if (cur < 30) {
		    		var url =  $(this).find("enclosure").attr('url');
		    		$('div[data-role=collapsible]').collapsible();
		    		seriesName[cur] = $(this).find("title").text();
		    		//seriesLength[cur] =  $(this).find("itunes:duration").text();
		    		seriesAudio[cur] = url;
		    		$("#rssChannelContent").append('<button class="ui-btn" onclick="getSeriesInf(' + 
		    				cur + ', ' + num + ')" text-overflow="ellipsis">' + 
		    				$(this).find("title").text() + '</button>');
		    	}
		    	cur++;
		    });
		}
}


// SHOW EPISODE PAGE (PLAYER, COVER etc)
function getSeriesInf(num_episode, num_channel){
	location.href = "#seriesInf";
	delete_db();
	setStartTime(seriesName[num_episode], seriesImg[num_channel], seriesAudio[num_episode], '0');
	$("#PodcasterName").html(seriesName[num_episode]);
	$("#PodcasterImg").html('<img width=90% src="' + seriesImg[num_channel] + '"/>');
	document.getElementById('episodeAudio').style.visibility = 'visible';
	document.getElementById('episodeAudio').src = seriesAudio[num_episode];
	document.getElementById('episodeAudio').load();
	$("#dButton").show();
	var music = document.getElementById('episodeAudio');
	music.addEventListener("timeupdate", function() {
		updateStartTime(music.currentTime);
	}, true);
}


// DOWNLOAD EPISODE FUNCTION
function downloadEpisode(){
	var dButton = document.getElementById("dButton");
	var notificationid;
	var listener = {
			   onprogress: function(id, receivedSize, totalSize) {
			     console.log('Received with id: ' + id + ', ' + receivedSize + '/' + totalSize);
			     },
			   onpaused: function(id) {
			     console.log('Paused with id: ' + id);
			   },
			   oncanceled: function(id) {
				   tizen.notification.remove(notificationid);
			     console.log('Canceled with id: ' + id);
			   },
			   oncompleted: function(id, path) {
				   tizen.notification.remove(notificationid);
				   var notificationDict1 = {
						   content : 'Downloaded into "music"',
				           vibration : true
				   };
				   var notification1 = new tizen.StatusNotification("SIMPLE",
				                  "TizenCast notification", notificationDict1);
				   tizen.notification.post(notification1);
				   console.log('Completed with id: ' + id + ', path: ' + path);
			   },
			   onfailed: function(id, error) {
				 tizen.notification.remove(notificationid);
			     console.log('Failed with id: ' + id + ', error name: ' + error.name);
			   }
	};
	
	var req = new tizen.DownloadRequest(String(document.getElementById('episodeAudio').src), 'music');
	try {
		var downloadId = tizen.download.start(req, listener);
	      var notificationDict = {
	                  content : 'Downloading into "music"',
	                  vibration : true,
	                  progressType: "PERCENTAGE",
	                  progressValue: 0
	                  };
	      var notification = new tizen.StatusNotification("PROGRESS",
	                  "TizenCast notification", notificationDict);

	      tizen.notification.post(notification);
	      notificationid = notification.id;
	 } catch (err) {
		 alert("Download failed");
	      console.log (err.name + ": " + err.message);
	 }
}