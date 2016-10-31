/*
 * grunt-agility-push
 * https://github.com/Will/grunt-agility-push
 *
 * Copyright (c) 2016
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    https = require('https'),
    util = require('util');

module.exports = function(grunt) {

    grunt.registerMultiTask('agility_push', 'Update policies in agility from local files.', function() {
        // grunt.file.defaultEncoding = 'ASCII';
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        var done = this.async();
        var options = this.options({});

        for (var file in this.files) {
            var src = this.files[file].src.toString();
            if (src.length != 0) {
                var updatedJSON = {};
                var jsonoutputraw = '';
                var jsonFileName = '';
                var updatedFile = grunt.file.read(src);

                //Create the json rest body
                if (src.indexOf('.json') == -1 && src.indexOf('.js') != -1) {
                    //If the file is a js file, it needs to be put back together with its json file before it is pushed to rest
                    jsonFileName = src.substring(0, src.indexOf('.js')) + '.json';
                    if (grunt.file.exists(jsonFileName)) {
                        updatedJSON = grunt.file.readJSON(jsonFileName);
                        updatedJSON.definition = updatedJSON.definition.substring(0, (updatedJSON.definition.indexOf('<script><![CDATA[') + 17)) + updatedFile + updatedJSON.definition.substring(updatedJSON.definition.indexOf(']]></script>'));
                    } else {
                        //If the json file is not the saem name as the js file it is probably an event policy
                        jsonFileName = src.substring(0, src.indexOf(options.delimiter)) + '.json';
                        if (grunt.file.exists(jsonFileName)) {
                            updatedJSON = grunt.file.readJSON(jsonFileName);
                            var scriptNameIndex = updatedJSON.definition.indexOf('<name>' + src.substring(src.indexOf(options.delimiter) + options.delimiter.length, src.indexOf('.js')));
                            var scriptStartIndex = updatedJSON.definition.indexOf('<body><![CDATA[', scriptNameIndex) + 15;
                            var scriptStopIndex = updatedJSON.definition.indexOf(']]></body>', scriptStartIndex);
                            updatedJSON.definition = updatedJSON.definition.substring(0, scriptStartIndex) + updatedFile + updatedJSON.definition.substring(scriptStopIndex);
                        } else {
                            grunt.fail.warn('ERROR: Could not find file: \'' + jsonFileName + '\'');
                        }
                    }
                } else if (src.indexOf('.json') != -1) {
                    //If changed file is a json file, no editing just send straight to rest call
                    jsonFileName = src;
                    updatedJSON = grunt.file.readJSON(src);
                }

                //Write the edited file locally and ~beautify~
                grunt.file.write(jsonFileName, JSON.stringify(updatedJSON));
                grunt.task.run('jsbeautifier');

                //Options for the rest call
                var req_options = {
                    hostname: options.agility_ip,
                    port: options.port,
                    path: '/agility/api/current/policy/' + updatedJSON.id,
                    auth: options.username + ':' + options.password,
                    method: 'PUT',
                    headers: {
                        'Content-type': 'application/json'
                    }
                };

                //Make the rest call
                var req = https.request(req_options, (res) => {

                    res.on('data', function(chunk) {
                        jsonoutputraw += chunk;
                    });

                    req.on('error', (e) => {
                        grunt.fail.fatal(e);
                    });

                    //Return from the rest call
                    res.on('end', function() {
                        if (jsonoutputraw.indexOf('<?xml version=') == -1) {
                            grunt.log.error('Rest returned something unexpected...');
                            grunt.log.error('ERROR: ' + jsonoutputraw);
                            grunt.log.error('JSON Body: ' + JSON.stringify(updatedJSON));
                        } else {
                            grunt.log.ok('Policy \'' + updatedJSON.name + '\' was pushed to agility.')
                        }
                        done();
                    });
                });
                req.write(JSON.stringify(updatedJSON)); //Pushes the rest json body
                req.end();
            }
        }
    });

    grunt.registerMultiTask('agility_pull', 'Pull down policies from agility in a readable/editable format.', function() {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        var done = this.async();

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            punctuation: '.',
            separator: ', '
        });

        var req_options = {
            hostname: '192.168.110.107',
            port: 8443,
            path: '/agility/api/current/policy/search?fields=*&limit=99999999',
            auth: options.username + ':' + options.password,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };
        var jsonoutputraw = '';
        var req = https.request(req_options, (res) => {

            res.on('data', function(chunk) {
                //Read the rest outpu to a single var
                jsonoutputraw += chunk;
            });

            req.on('error', (e) => {
                grunt.fail.fatal(e);
            });

            res.on('end', function() {
                var destDir = options.src_dest;
                var totalWrittenPolicies = 0;
                if (!grunt.file.exists(destDir)) {
                    grunt.file.mkdir(destDir);
                }
                var policies = JSON.parse(jsonoutputraw).assets;
                grunt.log.writeln('Found ' + policies.length + ' total policies.');
                for (let policy in policies) {
                    //Loop through all the policies returned parse them into editable files and write to files
                    if (policies[policy].version == -1) { //Could not consitantly get only in-progress policies so it is done here during parse
                        //Set file path
                        // var filepath = destDir + policies[policy].type.name + '/' + policies[policy].name;
                        var filepath = destDir;
                        if (options.tree_folders) {
                            filepath += policies[policy].assetPath.replace('.', '') + '/';
                        }
                        if (options.type_folders) {
                            filepath += policies[policy].type.name + '/';
                        }
                        filepath += policies[policy].name;
                        grunt.log.debug('policy: ', policies[policy].type.name, policies[policy].name, policies[policy].version);
                        if (policies[policy].type.name == 'LifecycleValidation' || policies[policy].type.name == 'LifecyclePostProcess') {
                            var definition = policies[policy].definition.substring(policies[policy].definition.indexOf('<script><![CDATA[') + 17, policies[policy].definition.indexOf(']]></script>'));
                            grunt.file.write(filepath + '.js', definition);
                            totalWrittenPolicies += 1;
                        } else if (policies[policy].type.name == 'Event') {
                            var definition = policies[policy].definition;
                            var found = true;
                            while (found) {
                                if (definition.indexOf('<Action type="Script">') == -1) {
                                    found = false;
                                } else {
                                    definition = definition.substring(definition.indexOf('<Action type="Script">') + 1);
                                    var tmpDefinitionName = definition.substring(definition.indexOf('<name>') + 6, definition.indexOf('</name>'));
                                    var tmpDefinition = definition.substring(definition.indexOf('<body><![CDATA[') + 15, definition.indexOf(']]></body>'));
                                    grunt.file.write(filepath + options.delimiter + tmpDefinitionName + '.js', tmpDefinition);
                                    totalWrittenPolicies += 1;
                                }
                            }
                        }
                        grunt.file.write(filepath + '.json', JSON.stringify(policies[policy]));
                        totalWrittenPolicies += 1;
                    }
                }
                done();
                if (totalWrittenPolicies) {
                    grunt.log.ok('Successfully wrote ' + totalWrittenPolicies + ' in-progress policies.');
                } else {
                    grunt.fail.fatal('Could not find and in-progress policies!');
                }

            });
        });
        req.end();
    });

};