        var map;
        var infoWindow;
        var myLatLng;
        var directionsService;
        var directionsDisplay
        var placeService;
        var resultsCount = 0;
        var markers = [];
        var infoWindows = [];
        var client_secret = "NRS4LCYCBPDO0LONV0A5D32T33WIVVMWZFQROBVMM02D3EPY";
        var client_id = "IHIMGHWDAZ53AFUZAG3R54KS3ZRGXA0YYQG5OQNYMXYVTNNK";
        var rDate = (new Date()).toISOString().slice(0, 10).replace(/-/g, "");
        var fourSquareResults = [];
        var apiKey = "AIzaSyDd7aBq0a2pSdAWWvVYIJMxjdS0fcZev8Y";
        var currRadius = 5000;
        var operation = 0;
        var restTypes = [];
        var restaurantTypeResults = [];
        var currentRestaurantFilter = "";
        var filterMarkerIcons = [];
        var clickedFilter = "";


        function initMap() {
            directionsDisplay = new google.maps.DirectionsRenderer;
            directionsService = new google.maps.DirectionsService;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    myLatLng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUpMap(myLatLng)
                });

                filterMarkerIcons["Chinese"] = "../images/restaurant_chinese.png";
                filterMarkerIcons["Japanese"] = "../images/japanese-food.png";
                filterMarkerIcons["Filipino"] = "../images/restaurant_buffet.png";
                filterMarkerIcons["Korean"] = "../images/restaurant_korean.png";
                filterMarkerIcons["Mexican"] = "../images/restaurant_mexican.png";
                filterMarkerIcons["Spanish"] = "../images/restaurant_mediterranean.png";
                filterMarkerIcons["Vietnamese"] = "../images/restaurant_thai.png";
                filterMarkerIcons["Italian"] = "../images/restaurant_italian.png";
                filterMarkerIcons["French"] = "../images/gourmet_0star.png";
                filterMarkerIcons["Grill"] = "../images/restaurant_steakhouse.png";


            } else {
                return;
            }

        }

        function clearAll() {
            clearAllDisplayResult();
            clearAllInfoWindow();
            directionsDisplay.setMap(null);
            directionsDisplay = null;
            directionsDisplay = new google.maps.DirectionsRenderer;
            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('right-panel'));
            $("#loadingResults").show();
            $("#right-panel").hide();
        }

        function populateMap(results, status, pagination) {
            var found = false;

            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach(function (result) {
                    createMarker(result, markers);
                });

                displayResult(results);
                handlePagination(results, status, pagination);
                resultsCount += results.length;
                $("#result_count").text(resultsCount);

                $('#restaurant_type input[type="checkbox"]').change(function () {
                    if (!$(this).is(':checked')) {
                        clearAllMarkers(restaurantTypeResults[$(this).val()]);
                    } else {
                        var count = $('#restaurant_type input[type="checkbox"]:checked').length;
                        restTypes = [];
                        $('#restaurant_type input[type="checkbox"]:checked').each(function () {
                            restTypes.push($(this).val());
                        });
                        if (restTypes.length) {
                            filterRestaurants(restTypes);
                        } else {
                            filterRestaurants(restTypes);
                        }
                    }
                });
            }

        }

        function setupInfoForMarker(place) {
            var $rateYo = $("#rateYo").rateYo({
                starWidth: "12px"
            });
            $rateYo.rateYo("rating", place.rating ? place.rating : 0);
            $("#resultName").text(place.name);
            $("#resultAddress").text(place.vicinity ? place.vicinity : place.formatted_address);
        }

        function createMarker(place, markers) {
            var placeLoc = place.geometry.location;
            var restaurantIcon = {
                url: currentRestaurantFilter.length ? filterMarkerIcons[currentRestaurantFilter] : place.icon,
                scaledSize: new google.maps.Size(25, 25),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(0, 0)
            };
            var marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                icon: restaurantIcon
            });
            var originLatLng = new google.maps.LatLng(myLatLng.lat, myLatLng.lng);

            marker.place = place;
            markers.push(marker);

            infoWindow = new google.maps.InfoWindow();
            infoWindows.push(infoWindow);

            marker.addListener('mouseover', function () {
                if (infoWindow.getContent() != place.name) {
                    setupInfoForMarker(place);
                    infoWindow.setContent($("#resultDetails").clone()[0]);
                    infoWindow.open(map, this);
                }
            });
            marker.addListener('mouseout', function () {
                infoWindow.close();
            });

            marker.addListener('click', function () {
                infoWindow = new google.maps.InfoWindow();
                infoWindows.push(infoWindow);

                infoWindow.setContent($("#resultDetails").clone()[0]);
                infoWindow.open(map, this);

                getRouteToDestination(place, infoWindow, marker);
            });
        }

        function setSearchMap() {
            var input = document.getElementById('pac-input');
            var placeInput = new google.maps.places.Autocomplete(input);
            placeInput.bindTo('bounds', map);

            infoWindow = new google.maps.InfoWindow();
            infoWindows.push(infoWindow);

            var marker = new google.maps.Marker({
                map: map,
                anchorPoint: new google.maps.Point(0, -29)
            });

            placeInput.addListener('place_changed', function () {
                infoWindow.close();
                marker.setVisible(false);
                var place = placeInput.getPlace();
                if (!place.geometry) {
                    window.alert("No details available for input: '" + place.name + "'");
                    return;
                }

                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);

                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }
                marker.setPosition(place.geometry.location);
                marker.setVisible(true);

                marker.addListener('click', function () {
                    getRouteToDestination(place, infoWindow, marker);
                });

                var infoWindowContent = place.name;
                infoWindow.setContent(infoWindowContent);
                infoWindow.open(map, marker);
            });
        }

        function getRouteToDestination(place, infoWindow, marker) {
            setupInfoForMarker(place);
            infoWindow.setContent($("#resultDetails").clone()[0]);
            infoWindow.open(map, marker);
            var request = {
                origin: myLatLng,
                destination: place.geometry.location,
                travelMode: 'DRIVING'
            };

            directionsService.route(request, function (response, status) {
                if (status === 'OK') {
                    directionsDisplay.setDirections(response);
                    $('#right-panel').show();
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
        }

        function handlePagination(results, status, pagination) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            } else {
                if (pagination.hasNextPage) {
                    var moreButton = document.getElementById('more');

                    moreButton.disabled = false;

                    moreButton.addEventListener('click', function () {
                        moreButton.disabled = true;
                        pagination.nextPage();
                    });
                }
            }
        }

        function displayResult(results) {
            if (markers.length) {
                $("#loadingResults").hide();
                $("#more").removeProp("disabled");
            }

            results.forEach(function (result) {
                markers.forEach(function (marker) {
                    var noDuplicate = $("#" + marker.place.place_id).length == 0;

                    if (noDuplicate) {
                        var photoUrl = (typeof marker.place.photos !== 'undefined') ? marker.place.photos[0].getUrl({
                            'maxHeight': 92
                        }) : '';
                        var vicinity = marker.place.vicinity ? marker.place.vicinity : marker.place.formatted_address;
                        var placeName = marker.place.name;
                        var liElement = $('<li id="' + marker.place.place_id + '" title="Click to get directions">');
                        liElement.attr('class', 'list-group-item');
                        var div = $('<div class="col-md-8">');

                        div.attr('class', 'content-details');
                        div.append('<div class="content-image pull-right" style="height:92px; width:92px; background: url(' + photoUrl + '); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>');
                        div.append('<span><label>' + placeName + '</label></span>');
                        div.append('<br />');

                        var subdiv = $('<div>');
                        subdiv.append('<p">' + vicinity + '</p>');
                        setupInfoForMarker(marker.place);
                        $('#rateYo').attr('title', marker.place.rating ? 'Rated: ' + marker.place.rating + ' out of 5' : 0 + ' out of 5');
                        subdiv.append($('#rateYo').clone()[0]);

                        if (marker.place.opening_hours == null) {
                            subdiv.append('<span class="label label-default">Unverified</span>');
                        } else if (marker.place.opening_hours.open_now) {
                            subdiv.append('<span class="label label-success">Open Now</span>');
                        } else {
                            subdiv.append('<span class="label label-default">Closed Now</span>');
                        }

                        div.append(subdiv);

                        infoWindow = new google.maps.InfoWindow();
                        infoWindows.push(infoWindow);

                        liElement.mouseover(function () {
                            setupInfoForMarker(marker.place);
                            infoWindow.setContent($("#resultDetails").clone()[0]);
                            infoWindow.open(map, marker);

                        });

                        liElement.click(function () {
                            clearAllInfoWindow();
                            getRouteToDestination(marker.place, infoWindow, marker);
                        });
                        liElement.mouseleave(function () {
                            infoWindow.close();
                        });
                        liElement.append(div);

                        $('#places').append(liElement);
                    }
                });
            });
        }

        function clearAllInfoWindow() {
            infoWindows.forEach(function (infoWindow) {
                infoWindow.close();
            });
        }

        function clearAllMarkers(markers) {
            if (markers != null) {
                markers.forEach(function (marker) {
                    marker.setMap(null);
                });
                markers = [];
            }
        }

        function clearAllDisplayResult() {
            $("#places").html('');
        }

        function setUpMap(position) {
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                title: 'Current Location',
                center: myLatLng,
                style: mapStyle
            });
            var homeMarker = new google.maps.Marker({
                map: map,
                position: myLatLng,
                title: 'Current Location'
            });
            homeMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')

//            var cityCircle = new google.maps.Circle({
//                strokeColor: '#98FB98',
//                strokeOpacity: 0.8,
//                strokeWeight: 2,
//                fillColor: '#98FB98',
//                fillOpacity: 0.35,
//                map: map,
//                center: myLatLng,
//                radius: currRadius
//            });

            setSearchMap();

            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('right-panel'));

            map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(document.getElementById('radiusModifier'));

            placeService = new google.maps.places.PlacesService(map);
            placeService.nearbySearch({
                location: myLatLng,
                radius: 5000,
                type: ['restaurant']
            }, populateMap);

            $("#radiusModifier").on("input", function () {
                cityCircle.setRadius(100 * this.value);
            });
            $("#radiusModifier").change(function () {
                clearAll();
                clearAllMarkers(markers);
                placeService = new google.maps.places.PlacesService(map);
                placeService.nearbySearch({
                    location: myLatLng,
                    radius: $(this).val() * 100,
                    type: ['restaurant']
                }, populateMap);
            });

            $("#hideRightPanel").on('click', function () {
                $("#right-panel").hide();
            });
        }

        function filterRestaurants(restaurantTypes) {
            currentRestaurantFilter = "";

            restaurantTypes.forEach(function (restaurantType, index) {
                placeService = new google.maps.places.PlacesService(map);
                currentRestaurantFilter = restaurantType;
                if (!restaurantTypeResults.hasOwnProperty(restaurantType)) {
                    $("#restaurant_type ul li input[type='checkbox']").prop({
                        disabled: true
                    });
                    placeService.textSearch({
                        location: myLatLng,
                        radius: currRadius,
                        type: ['restaurant'],
                        query: restaurantType
                    }, storeRestaurantTypeMarkers);
                } else {
                    if (restaurantTypeResults[restaurantType][0].map == null) {
                        restaurantTypeResults[restaurantType].forEach(function (marker) {
                            marker.setMap(map);
                        });
                    }
                }
            });
        }

        function storeRestaurantTypeMarkers(results, status) {
            if (status == "OK") {
                restaurantTypeResults[currentRestaurantFilter] = [];
                results.forEach(function (result) {
                    createMarker(result, restaurantTypeResults[currentRestaurantFilter]);
                });

                $("#restaurant_type ul li input[type='checkbox']").prop({
                    disabled: false
                });
            }
        }
