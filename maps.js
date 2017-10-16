        var map;
        var infoWindow;
        var myLatLng;
        var directionsService;
        var directionsDisplay
        var resultsCount = 0;
        function initMap() {

            directionsDisplay = new google.maps.DirectionsRenderer;
            directionsService = new google.maps.DirectionsService;
            myLatLng = {
                lat: 10.3107894,
                lng: 123.8909098
            }; //Osmena Fuenta Lat Long  
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                title: 'Current Location',
                center: myLatLng
            });
            var homeMarker = new google.maps.Marker({
                map: map,
                position: myLatLng
            });
            homeMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')

            setSearchMap(map);

            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('right-panel'));



            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: myLatLng,
                radius: 5000,
                type: ['restaurant']
            }, callback);

            var cityCircle = new google.maps.Circle({
                strokeColor: '#98FB98',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#98FB98',
                fillOpacity: 0.35,
                map: map,
                center: myLatLng,
                radius: 5000
            });
        }

        function callback(results, status, pagination) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                }
                
                processResults(results, status, pagination);
                resultsCount+= results.length;
                $("#result_count").text(resultsCount);
            }
            
        }

        function createMarker(place) {
            var placeLoc = place.geometry.location;
            var marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                title: place.name
            });

            google.maps.event.addListener(marker, 'click', function () {
                infoWindow = new google.maps.InfoWindow();
                infoWindow.setContent(place.name);
                infoWindow.open(map, this);

                var request = {
                    origin: myLatLng,
                    destination: place.geometry.location,
                    travelMode: 'DRIVING'
                };

                directionsService.route({
                    origin: myLatLng,
                    destination: place.geometry.location,
                    travelMode: 'DRIVING'
                }, function (response, status) {
                    if (status === 'OK') {
                        directionsDisplay.setDirections(response);
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                });
            });
        }

        function setSearchMap(map) {
            var input = document.getElementById('pac-input');
            var searchBox = new google.maps.places.SearchBox(input);
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

            // Bias the SearchBox results towards current map's viewport.
            map.addListener('bounds_changed', function () {
                searchBox.setBounds(map.getBounds());
            });

            var markers = [];
            // Listen for the event fired when the user selects a prediction and retrieve
            // more details for that place.
            searchBox.addListener('places_changed', function () {
                var places = searchBox.getPlaces();

                if (places.length == 0) {
                    return;
                }

                // Clear out the old markers.
                markers.forEach(function (marker) {
                    marker.setMap(null);
                });
                markers = [];

                // For each place, get the icon, name and location.
                var bounds = new google.maps.LatLngBounds();
                places.forEach(function (place) {
                    if (!place.geometry) {
                        console.log("Returned place contains no geometry");
                        return;
                    }
                    var icon = {
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };

                    // Create a marker for each place.
                    markers.push(new google.maps.Marker({
                        map: map,
                        icon: icon,
                        title: place.name,
                        position: place.geometry.location
                    }));

                    if (place.geometry.viewport) {
                        // Only geocodes have viewport.
                        bounds.union(place.geometry.viewport);
                    } else {
                        bounds.extend(place.geometry.location);
                    }
                });
                map.fitBounds(bounds);
            });
        }

        function processResults(results, status, pagination) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            } else {
                displayResults(results);

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

        function displayResults(places) {

            var bounds = new google.maps.LatLngBounds();
            var placesList = document.getElementById('places');

            for (var i = 0, place; place = places[i]; i++) {
                placesList.innerHTML += '<li><label>' + place.name + '</label></li>';
                bounds.extend(place.geometry.location);
            }
            map.fitBounds(bounds);
        }
