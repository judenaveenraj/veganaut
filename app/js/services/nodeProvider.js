(function(servicesModule) {
    'use strict';

    /**
     * Node Class
     * @param nodeData
     * @constructor
     */
    var Node = function(nodeData) {
        for (var key in nodeData) {
            if (nodeData.hasOwnProperty(key)) {
                this[key] = nodeData[key];
            }
        }
    };

    /**
     * Returns whether this node is the 'me' node
     * @returns {boolean}
     */
    Node.prototype.isMe = function() {
        return this.relation === 'me';
    };

    /**
     * nodeProvider provides the nodes and links for the social graph
     */
    servicesModule.provider('nodeProvider', function() {
        var nodes = [];
        var links = [];
        var isStable = false;

        this.$get = ['backend', function(backend) {
            return {
                getNodes: function(cb) {
                    backend.getGraph()
                        .success(function(data) {
                            isStable = false;
                            nodes = [];
                            links = [];

                            var nodeIdToIndexMap = {};

                            // Backend gives an object indexed by node id
                            // We need an array
                            for (var nodeId in data.nodes) {
                                if (data.nodes.hasOwnProperty(nodeId)) {
                                    // TODO: Mock, until backend delivers attribute
                                    data.nodes[nodeId].captured = (Math.random() > 0.5);
                                    nodes.push(new Node(data.nodes[nodeId]));
                                    nodeIdToIndexMap[nodeId] = nodes.length - 1;
                                }
                            }

                            // Change referenced from node id to indices
                            for (var i = 0; i < data.links.length; i++) {
                                var link = data.links[i];
                                link.source = nodeIdToIndexMap[link.source];
                                link.target = nodeIdToIndexMap[link.target];
                                links.push(link);
                            }

                            // Add a dummy
                            nodes.push({
                                fullName: 'Mister Dummy',
                                type: 'dummy'
                            });

                            // Or two
                            nodes.push({
                                fullName: 'Miss Dummy',
                                type: 'dummy'
                            });

                            cb(nodes, links);
                        })
                        .error(function(data, statusCode) {
                            console.log('Error requesting graph data', data, statusCode);
                        })
                    ;

                },
                isStable: function() {
                    return isStable;
                },
                setStable: function(stable) {
                    isStable = stable;
                }
            };
        }];
    });
})(window.monkeyFace.servicesModule);
