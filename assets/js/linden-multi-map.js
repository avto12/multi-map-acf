(function () {
	'use strict';

	var darkMapStyles = [
		{ elementType: 'geometry', stylers: [{ color: '#242424' }] },
		{ elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
		{ elementType: 'labels.text.fill', stylers: [{ color: '#6f6f6f' }] },
		{ elementType: 'labels.text.stroke', stylers: [{ color: '#202020' }] },
		{ featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#333333' }] },
		{ featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#747474' }] },
		{ featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
		{ featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#747474' }] },
		{ featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#292929' }] },
		{ featureType: 'poi', stylers: [{ visibility: 'off' }] },
		{ featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
		{ featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2e2e2e' }] },
		{ featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
		{ featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#252525' }] },
		{ featureType: 'transit', stylers: [{ visibility: 'off' }] },
		{ featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1b1b1b' }] },
		{ featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#545454' }] }
	];

	function markerIcon(color, size) {
		var width = Number(size) || 46;
		var height = Math.round(width * 60 / 46);
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="60" viewBox="0 0 46 60">' +
			'<path fill="' + color + '" d="M23 0C10.3 0 0 10.1 0 22.5 0 39.7 23 60 23 60s23-20.3 23-37.5C46 10.1 35.7 0 23 0Z"/>' +
			'<circle cx="23" cy="22" r="10.5" fill="#2a2a2a"/>' +
			'<circle cx="23" cy="22" r="5.5" fill="#1a1a1a"/>' +
			'</svg>';

		return {
			url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
			scaledSize: new google.maps.Size(width, height),
			anchor: new google.maps.Point(width / 2, height)
		};
	}

	function imageMarkerIcon(url, size) {
		var width = Number(size) || 25;
		var height = width;

		return {
			url: url,
			scaledSize: new google.maps.Size(width, height),
			anchor: new google.maps.Point(width / 2, height)
		};
	}

	function locationMarkerIcon(location, config) {
		var icon = location.icon || config.pinIcon || '';

		if (icon) {
			return imageMarkerIcon(icon, config.pinSize);
		}

		return markerIcon(config.pinColor || '#15421f', config.pinSize);
	}

	function clusterIcon(color, count) {
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58">' +
			'<circle cx="29" cy="29" r="28" fill="none" stroke="#d9d9d9" stroke-width="1" stroke-dasharray="2 3" opacity=".85"/>' +
			'<circle cx="29" cy="29" r="23" fill="' + color + '"/>' +
			'<text x="29" y="35" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="700">' + count + '</text>' +
			'</svg>';

		return {
			url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
			scaledSize: new google.maps.Size(58, 58),
			anchor: new google.maps.Point(29, 29)
		};
	}

	function initMap(config) {
		var element = document.getElementById(config.id);

		if (!element || !config.locations || !config.locations.length) {
			return;
		}

		var center = {
			lat: Number(config.locations[0].lat),
			lng: Number(config.locations[0].lng)
		};

		var map = new google.maps.Map(element, {
			center: center,
			zoom: Number(config.zoom) || 13,
			styles: darkMapStyles,
			mapTypeControl: false,
			fullscreenControl: false,
			streetViewControl: false,
			zoomControl: true,
			backgroundColor: '#242424'
		});

		var bounds = new google.maps.LatLngBounds();
		var infoWindow = new google.maps.InfoWindow();
		var markers = [];
		var clusterMarkers = [];

		config.locations.forEach(function (location) {
			var position = {
				lat: Number(location.lat),
				lng: Number(location.lng)
			};
			var marker = new google.maps.Marker({
				position: position,
				map: map,
				icon: locationMarkerIcon(location, config),
				title: location.address || ''
			});

			marker.lindenLocation = location;
			marker.lindenPosition = position;
			markers.push(marker);
			bounds.extend(position);

			marker.addListener('click', function () {
				infoWindow.setContent(popupContent(location));
				infoWindow.open(map, marker);
			});
		});

		if (config.fitBounds !== false && config.locations.length > 1) {
			map.fitBounds(bounds, 56);
		}

		if (config.cluster !== false && config.locations.length > 1) {
			google.maps.event.addListener(map, 'idle', function () {
				renderClusters(map, markers, clusterMarkers, infoWindow, config);
			});
			renderClusters(map, markers, clusterMarkers, infoWindow, config);
		}
	}

	function renderClusters(map, markers, clusterMarkers, infoWindow, config) {
		var zoom = map.getZoom() || 1;
		var maxZoom = Number(config.clusterMaxZoom) || 15;
		var radius = Number(config.clusterRadius) || 72;
		var clusters;

		clearClusterMarkers(clusterMarkers);

		if (zoom >= maxZoom) {
			markers.forEach(function (marker) {
				marker.setMap(map);
			});
			return;
		}

		clusters = buildClusters(markers, zoom, radius);

		clusters.forEach(function (cluster) {
			if (cluster.markers.length === 1) {
				cluster.markers[0].setMap(map);
				return;
			}

			cluster.markers.forEach(function (marker) {
				marker.setMap(null);
			});

			clusterMarkers.push(createClusterMarker(map, cluster, config, infoWindow));
		});
	}

	function buildClusters(markers, zoom, radius) {
		var clusters = [];

		markers.forEach(function (marker) {
			var point = latLngToPoint(marker.lindenPosition.lat, marker.lindenPosition.lng, zoom);
			var target = null;

			clusters.some(function (cluster) {
				var dx = cluster.point.x - point.x;
				var dy = cluster.point.y - point.y;

				if (Math.sqrt(dx * dx + dy * dy) <= radius) {
					target = cluster;
					return true;
				}

				return false;
			});

			if (!target) {
				target = {
					point: point,
					lat: 0,
					lng: 0,
					markers: []
				};
				clusters.push(target);
			}

			target.markers.push(marker);
			target.lat += marker.lindenPosition.lat;
			target.lng += marker.lindenPosition.lng;
			target.point.x = ((target.point.x * (target.markers.length - 1)) + point.x) / target.markers.length;
			target.point.y = ((target.point.y * (target.markers.length - 1)) + point.y) / target.markers.length;
		});

		clusters.forEach(function (cluster) {
			cluster.lat = cluster.lat / cluster.markers.length;
			cluster.lng = cluster.lng / cluster.markers.length;
		});

		return clusters;
	}

	function createClusterMarker(map, cluster, config, infoWindow) {
		var marker = new google.maps.Marker({
			position: { lat: cluster.lat, lng: cluster.lng },
			map: map,
			icon: clusterIcon(config.pinColor || '#15421f', cluster.markers.length),
			label: null,
			zIndex: 999
		});

		marker.addListener('click', function () {
			var bounds = new google.maps.LatLngBounds();
			var nextZoom = Math.min((map.getZoom() || 1) + 3, Number(config.clusterMaxZoom) || 15);

			infoWindow.close();

			cluster.markers.forEach(function (item) {
				bounds.extend(item.getPosition());
			});

			google.maps.event.addListenerOnce(map, 'bounds_changed', function () {
				if ((map.getZoom() || 1) < nextZoom) {
					map.setZoom(nextZoom);
				}
			});

			if (cluster.markers.length > 1) {
				map.fitBounds(bounds, 88);
			}
		});

		return marker;
	}

	function clearClusterMarkers(clusterMarkers) {
		while (clusterMarkers.length) {
			clusterMarkers.pop().setMap(null);
		}
	}

	function latLngToPoint(lat, lng, zoom) {
		var siny = Math.sin(lat * Math.PI / 180);
		var scale = 256 * Math.pow(2, zoom);

		siny = Math.min(Math.max(siny, -0.9999), 0.9999);

		return {
			x: scale * (0.5 + lng / 360),
			y: scale * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
		};
	}

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, function (character) {
			return {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#039;'
			}[character];
		});
	}

	function popupContent(location) {
		var title = location.title || location.address || '';
		var description = location.description || '';
		var image = location.image || '';
		var link = location.link || '';
		var linkData = link ? ' data-link="' + escapeAttribute(link) + '" role="link" tabindex="0"' : '';
		var imageHtml = image ? '<img class="linden-multi-map-card__image" src="' + escapeAttribute(image) + '" alt="' + escapeAttribute(title) + '">' : '';
		var titleHtml = title ? '<h3 class="linden-multi-map-card__title">' + escapeHtml(title) + '</h3>' : '';
		var descriptionHtml = description ? '<div class="linden-multi-map-card__description">' + description + '</div>' : '';

		return '<div class="linden-multi-map-card"' + linkData + '>' +
			imageHtml +
			'<span class="linden-multi-map-card__shade" aria-hidden="true"></span>' +
			'<span class="linden-multi-map-card__content">' +
			titleHtml +
			descriptionHtml +
			'</span>' +
			'</div>';
	}

	function escapeAttribute(value) {
		return escapeHtml(value).replace(/`/g, '&#096;');
	}

	window.LindenMultiMapInit = function () {
		(window.LindenMultiMapData || []).forEach(initMap);
	};

	if (window.google && window.google.maps) {
		window.LindenMultiMapInit();
	}

	document.addEventListener('click', function (event) {
		var card = event.target.closest('.linden-multi-map-card[data-link]');

		if (!card) {
			return;
		}

		window.location.href = card.getAttribute('data-link');
	});

	document.addEventListener('keydown', function (event) {
		var card = event.target.closest('.linden-multi-map-card[data-link]');

		if (!card || (event.key !== 'Enter' && event.key !== ' ')) {
			return;
		}

		event.preventDefault();
		window.location.href = card.getAttribute('data-link');
	});
})();
