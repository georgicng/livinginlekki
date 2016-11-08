function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  minZoom: 12,
	  zoom: 15,
	  maxZoom: 18,
	  center: {lat: 6.4589850, lng: 3.6015210}
	});
	
	var image = 'images/beachflag.png';
		 var beachMarker = new google.maps.Marker({
			map: map,
			anchorPoint: new google.maps.Point(200,200),
			icon: image,
			zIndex: 1000
	});

	function showInContentWindow(prop, search) {
		
	var el = $( '<div></div>' );
	el.html(prop.description);
	var x = $('img', el).attr('src');
	if (!x)
		x = "http://placehold.it/400x300";
	  var sidediv = document.getElementById('details');
	  var text = '<div class="feature">' +
			'<header>' +
			'<h1 class="feature-name" id="fix-header">' +
			prop.name +
			'</h1>' +
			'</header></div>';

	  sidediv.innerHTML = text;
		
	  $('header').parallax({imageSrc: x});	
	  
	  if (prop.name) {
		$( "#art-contents" ).load( "proxy.php?mode=native&url=http://www.livinginlekki.com/?s=" + prop.name.replace(/\s/g,'+') + ' .td-ss-main-content>.td-block-row');
	  }
	  $('#content-window').scroll(function() {
		if ($(this).scrollTop() > 300){ 
		  	$('header').css({position: 'static'});
		    $('.feature-name').addClass("sticky");
		  }
		  else{
		  	$('header').css({position: 'relative'});
		    $('.feature-name').removeClass("sticky");
		  }
		});
	  if (prop.description && !prop.description.includes("?s=")) {
	  	var links = [];
	  	var result = URI.withinString(prop.description, function(url) {
		   if(url.search('livinginlekki') != -1)
		   	links.push(url);
		   return '<a>' + url + '</a>';
		});
		if (links.length) {
			$.getJSON( "om.php?url="+links[0], function( data ) {
			  if (data.title)		 
			  	$( "#oembed").appendTo( data.html );
			});
		}
		
	  }
	  
	}
	
	function setCenter(point, collection){
		if (point) {
			map.setCenter(point);
			return;
		}
		var params={};
		window.location.search
		  .replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str,key,value) {
			params[key] = value;
		  }
		);
		
		if (params['center'] && collection) {
			var loc = _.chain(collection).findWhere({"id": parseInt(params['center'])}).pick('properties').pluck('category').value();
			var feat = layers[loc[0]].getFeatureById(params['center']);
			layers[loc[0]].revertStyle();	
			layers[loc[0]].overrideStyle(feat, {visible: false});			
			map.setCenter(feat.getGeometry().get());
			beachMarker.setPosition(feat.getGeometry().get()); 
			showInContentWindow({ name: feat.getProperty('name'), description: feat.getProperty('description')});
		} else if (params['place'] && collection) {
			var loc = _.chain(collection).find(function(x){ var y = getKey(x, 'properties.name'); return y.toLowerCase().includes(params['place'].replace("_"," ").toLowerCase());}).value();
			if (loc) {
				var feat = layers[loc.properties.category].getFeatureById(loc.id);	
				layers[loc.properties.category].revertStyle();
				layers[loc.properties.category].overrideStyle(feat, {visible: false});
				map.setCenter(feat.getGeometry().get());			
				beachMarker.setPosition(feat.getGeometry().get()); 
				showInContentWindow({ name: feat.getProperty('name'), description: feat.getProperty('description')});
			}
			
		} else {
			var loc = _.chain(collection).findWhere({"id": 789384763}).pick('properties').pluck('category').value();
			var feat = layers[loc[0]].getFeatureById('789384763');
			layers[loc[0]].revertStyle();	
			layers[loc[0]].overrideStyle(feat, {visible: false});	
			map.setCenter(feat.getGeometry().get());			
			beachMarker.setPosition(feat.getGeometry().get()); 
		}
		
	}
	
	 function SearchControl(controlDiv, map) {		
		var controlInput = document.createElement('input');
		controlInput.type = "text";
		controlInput.className = "search";
		controlInput.placeholder = 'Search for places....';
		controlDiv.appendChild(controlInput);
	 }

	 function createCheckbox(container, value) {
		var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
		checkbox.value = value;
		checkbox.name = 'option[]';

		var label = document.createElement('label');		
		label.appendChild(checkbox);
		label.appendChild(document.createTextNode(value));
		container.appendChild(label);
	 }
	 
	 function getKey(obj, key) {
		return key.split(".").reduce(function(o, x) {
			return (typeof o == "undefined" || o === null) ? o : o[x];
		}, obj);
	}

	function revertStyle() {
		_.chain(layers).values().each(function(x){
			x.revertStyle();
		});
	}
	
	
	jQuery.fn.multiselect = function() {
		$(this).each(function() {
			var checkboxes = $(this).find("input:checkbox");
			checkboxes.each(function() {
				var checkbox = $(this);
				// Highlight pre-selected checkboxes
				if (checkbox.prop("checked"))
					checkbox.parent().addClass("multiselect-on");
	 
				// Highlight checkboxes that the user selects
				checkbox.click(function() {
					if (checkbox.prop("checked"))
						checkbox.parent().addClass("multiselect-on");
					else
						checkbox.parent().removeClass("multiselect-on");
				});
			});
		});
	};


	
	$.ajax('assets/places.kml').done(function(xml) {
		var geoJson = toGeoJSON.kml(xml);
		x = geoJson;
		layers = {};
		var infowindow = new google.maps.InfoWindow();
		var categories = _.chain(geoJson.features)
		.map(function(x){
			return x.properties;
		})
		.pluck('category')
		.uniq()
		.value();
		_.each(categories, function (x){
			if(x) {
				var feat = _.chain(geoJson.features)
				.filter(function(y){
					return y.properties.category === x;
				})
				.value();
				
				var dataLayer = new google.maps.Data();
				dataLayer.addGeoJson({type: "FeatureCollection", features: feat});
				dataLayer.setStyle(function(feature) {
					var style = feature.getProperty('style');
					style = (style)? getKey(style, 'normal.IconStyle.Icon.href'): null;
				  	if (feature.getProperty('selected')) {
					    style = 'images/beachflag.png';
					  }
					return /** @type {google.maps.Data.StyleOptions} */({
						icon: style
					  });		  
				  
				});
				dataLayer.addListener('click', function(event) {
					showInContentWindow({ description: event.feature.getProperty('description'), name: event.feature.getProperty('name') });
					beachMarker.setPosition(event.feature.getGeometry().get());
					//event.feature.setProperty('selected', true);
					revertStyle();
					dataLayer.overrideStyle(event.feature, {visible: false});					
				});
				dataLayer.addListener('mouseover', function(event) {
					var myHTML = event.feature.getProperty('name');
					infowindow.setContent("<div style='width:150px; text-align: center;'>"+myHTML+"</div>");
					infowindow.setPosition(event.feature.getGeometry().get());
					infowindow.setOptions({pixelOffset: new google.maps.Size(0,-30)});
					infowindow.open(map);
				});
				dataLayer.setMap(map);
				layers[x] = dataLayer;
			}
			
		});
		setCenter(null, geoJson.features);
		
		var centerControlDiv = document.createElement('div');
		centerControlDiv.className = 'search-control'
        searchControl = new SearchControl(centerControlDiv, map);

        centerControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
		google.maps.event.addListenerOnce(map, 'tilesloaded', function(evt) {
		  $('.search').remoteList({
				minLength: 0,
				maxLength: 0,
				source: function(value, response){
					var suggestions = _.chain(geoJson.features)
					.filter(function(v){ 
						return getKey(v, 'properties.name').toLowerCase().includes(value.toLowerCase()) || getKey(v, 'properties.description').toLowerCase().includes(value.toLowerCase()) 
					})
					.map(function(v){ 
						var obj = {};
						obj.id = v.id;
						obj.value = getKey(v, 'properties.name');
						obj.label = getKey(v, 'properties.category');
						obj.img = getKey(v, 'properties.style.highlight.Iconstyle.Icon.href');
						obj.category = getKey(v, 'properties.category');
						return obj; 
					})
					.value();
					response(suggestions);
				},
				select: function(){
					var choice = $(this).remoteList('selectedData');
					/* var point = _.chain(geoJson.features)
					.findWhere({id: choice.value})
					.pick('geometry')
					.pluck('coordinates')
					.value();
					console.log(point);
					map.setCenter({lat:  parseFloat(point[0]), lng:  parseFloat(point[1])}); */
					var feat = layers[choice.category].getFeatureById(choice.id);
					revertStyle();
					layers[choice.category].overrideStyle(feat, {visible: false});
					beachMarker.setPosition(feat.getGeometry().get());	
					map.setCenter(feat.getGeometry().get());
					showInContentWindow({ name: feat.getProperty('name'), description: feat.getProperty('description')});

				},			
				renderItem: function(value, label, data){
					return '<img src="'+ data.img +'" />'+ value;
				}
			});
			
			$(function() {
				 $(".multiselect").multiselect();
			});
			 
			$( "input[type=checkbox]" ).on( "click", function() {
				
			  _.chain(layers).values().each( function(x){
					  x.setMap(null);
				});
			  $( "input:checked" ).each(function (index, value){				  
					var val = $(this).val();
					layers[val].setMap(map);
				});
			});
						
						
		});
		
		var filterControlDiv = document.createElement('div');
		filterControlDiv.className="f-control";
		var filterHeaderDiv = document.createElement('div');
		filterHeaderDiv.className="f-header";
		var filterTextDiv = document.createElement('div');
		filterTextDiv.className="f-desc";
		var ft = document.createTextNode("Filter");
		var btn = document.createElement("BUTTON");
		btn.className="f-button";// Create a <button> element
		var t = document.createTextNode("Reset");       // Create a text node
		btn.appendChild(t); 
		  btn.onclick = function() { // Note this is a function
			_.chain(layers).values().each( function(x){
					  x.setMap(map);
			});
			
			$( "input:checked" ).each(function (index, value){				  
					$(this).prop('checked', false);
					$(this).parent().removeClass("multiselect-on");
			});
		  };
		 filterTextDiv.appendChild(ft);		 
        filterHeaderDiv.appendChild(filterTextDiv);
        filterHeaderDiv.appendChild(btn);
		filterControlDiv.appendChild(filterHeaderDiv);
		var filterDiv = document.createElement('div');		
		filterDiv.className = "multiselect";
		
		_.each(categories, function(x){
			if(x) {				
				createCheckbox(filterDiv, x );
			}
		});
		
		filterControlDiv.appendChild(filterDiv);

        filterControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(filterControlDiv);
		
	});
	
 }



 
