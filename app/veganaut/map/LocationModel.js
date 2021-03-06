(function(module) {
    'use strict';

    module.service('Location', ['Leaflet', 'Visit',
        function(L, Visit) {
            /**
             * Represents a location on the map.
             * A location has general information (name, type, ...), coordinates
             * and aggregated data from missions as well as missions themselves.
             *
             * @param {{}} [jsonData={}]
             * @constructor
             */
            function Location(jsonData) {
                // Explicitly define all the properties
                this.id = undefined;
                this.team = undefined;
                this.lat = undefined;
                this.lng = undefined;
                this.name = undefined;
                this.description = undefined;
                this.link = undefined;
                this.type = undefined;
                this.points = {};
                this.quality = {
                    average: 0,
                    numRatings: 0
                };
                this.products = [];
                this.lastMissionDates = {};
                this.updatedAt = undefined;

                // Apply the given data
                // TODO: this should deep copy, otherwise quality might not have a valid value
                angular.extend(this, jsonData || {});

                /**
                 * Whether this location shows as active on the map
                 * @type {boolean}
                 * @private
                 */
                this._active = false;

                /**
                 * Whether this location is currently displayed on the map
                 * @type {boolean}
                 * @private
                 */
                this._hidden = false;

                /**
                 * Leaflet Marker representing this location
                 * @type {L.Marker}
                 */
                this.marker = L.marker([this.lat, this.lng], {
                    title: this.name
                });

                // Instantiate the dates
                // TODO: this should already have been done elsewhere
                var that = this;
                _.forOwn(this.lastMissionDates, function(date, mission) {
                    that.lastMissionDates[mission] = new Date(date);
                });
                this.updatedAt = new Date(this.updatedAt);

                this._updateMarker();
            }

            /**
             * The possible types of locations
             * @type {{gastronomy: string, retail: string}}
             */
            Location.TYPES = {
                gastronomy: 'gastronomy',
                retail: 'retail'
            };

            /**
             * Makes sure the Leaflet marker is up to date with the current
             * model state. Sets the icon html and the css as well as the
             * locationId on the marker.
             * @private
             */
            Location.prototype._updateMarker = function() {
                // Create the basic icon settings
                var icon = {
                    iconSize: null, // Needs to be set to null so it can be specified in CSS
                    className: 'map-location type-' + this.type + ' team-' + this.team,
                    html: ''
                };

                // Set the html based on the "quality"
                if (this.quality.numRatings > 0) {
                    icon.html = '<span class="map-icon icon icon-' + this.getRoundedQuality() + '"></span>';
                }

                // Add active class if active
                if (this._active) {
                    icon.className += ' active';
                }

                // Add hidden class if hidden
                if (this._hidden) {
                    // TODO: better to just remove it from the map entirely?
                    icon.className += ' hidden';
                }

                // TODO: only do this if something actually changed
                this.marker.setIcon(L.divIcon(icon));

                // Make sure the marker still hast the correct location id set
                this.marker.locationId = this.id;
            };

            /**
             * Sets the lat/lng of this location and updates the
             * leaflet marker.
             * @param {number} lat
             * @param {number} lng
             */
            Location.prototype.setLatLng = function(lat, lng) {
                // TODO: make lat/lng private
                this.lat = lat;
                this.lng = lng;
                this.marker.setLatLng([this.lat, this.lng]);
            };

            /**
             * Sets the location as active or inactive
             * @param {boolean} [isActive=true]
             */
            Location.prototype.setActive = function(isActive) {
                if (typeof isActive === 'undefined') {
                    isActive = true;
                }
                isActive = !!isActive;

                // Update active state if it changed
                if (this._active !== isActive) {
                    this._active = isActive;

                    // Update marker
                    this._updateMarker();
                }
            };

            /**
             * Whether the location is active
             * @returns {boolean}
             */
            Location.prototype.isActive = function() {
                return this._active;
            };

            /**
             * Sets the location to be hidden or shown on the map
             * @param {boolean} isHidden
             */
            Location.prototype.setHidden = function(isHidden) {
                if (typeof isHidden === 'undefined') {
                    isHidden = true;
                }
                isHidden = !!isHidden;

                // Update hidden state if it changed
                if (this._hidden !== isHidden) {
                    this._hidden = isHidden;

                    // Update marker
                    this._updateMarker();
                }
            };

            /**
             * Returns whether the current location is hidden
             * @returns boolean
             */

            Location.prototype.isHidden = function() {
                return this._hidden;
            };


            /**
             * Returns an array of all the points starting with the highest:
             * { team: 'color', points: 100 }
             * @returns {{}}
             */
            Location.prototype.getSortedPoints = function() {
                // TODO: should be possible to clear the memoiziation
                this.sortedPoints = this.sortedPoints || _.chain(this.points)
                    .map(function(value, key) {
                        return { team: key, points: value };
                    })
                    .sortBy('points')
                    .reverse()
                    .value()
                ;
                return this.sortedPoints;
            };

            /**
             * Returns a visit of this location
             * @param {Player} player The player to get the visit for
             * @returns {Visit}
             */
            Location.prototype.getVisit = function(player) {
                if (this.type !== Location.TYPES.private) {
                    return new Visit(this, player);
                }
            };

            /**
             * Returns the Product with the given id if it exists
             * @param {string} productId
             * @return {Product}
             */
            Location.prototype.getProductById = function(productId) {
                return _.find(this.products, { id: productId });
            };

            /**
             * Returns the average quality rounded to a number between 0 and 5.
             * 0 means there are no ratings.
             * @returns {number}
             */
            Location.prototype.getRoundedQuality = function() {
                var avg = this.quality.average || 0;
                return Math.min(5, Math.max(0, Math.round(avg)));
            };

            /**
             * Returns the URL of this location
             * @param {boolean} [edit=false] Whether to return the URL to edit
             *      this location
             * @returns {string}
             */
            Location.prototype.getUrl = function(edit) {
                var url = '/location/' + this.id;
                if (edit === true) {
                    url += '/edit';
                }
                return url;
            };

            /**
             * Updates this Location with the new data loaded from the backend
             * @param {{}} newData
             */
            Location.prototype.update = function(newData) {
                // TODO: should only update what is actually given in the newData
                // TODO: should be merged with the constructor and just be less ugly
                // TODO: this is a mess: locationService returns already instantiated model, shouldn't.
                this.id = newData.id;
                this.team = newData.team;
                this.name = newData.name;
                this.description = newData.description;
                this.link = newData.link;
                this.points = newData.points;
                this.quality = newData.quality;
                this.products = newData.products;
                this.lastMissionDates = newData.lastMissionDates;
                this.updatedAt = newData.updatedAt;
                this._updateMarker();
                this.setLatLng(newData.lat, newData.lng);

                // Clear points memoiziation
                this.sortedPoints = undefined;

                // TODO: update the marker 'title'
            };

            return Location;
        }
    ]);
})(window.veganaut.mapModule);
