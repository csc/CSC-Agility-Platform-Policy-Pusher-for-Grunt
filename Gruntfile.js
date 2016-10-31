/*
 * grunt-agility-policy-pusher
 * https://github.com/ServiceMesh/support/tree/master/grunt-agility-policy-pusher
 *
 * Copyright (c) 2016
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var agility_config = {
        options: {
            'agility_ip': 'localhost',
            'port': 8443,
            'username': 'admin',
            'password': 'password',
            'src_dest': 'src/',
            'delimiter': '___',
            'tree_folders': true, //If true, puts policies into a tree folder structure to mimic the tree in agility,
            'type_folders': false //If true, seperates policies into folders based on type (event, lifecycle-validation, etc)
        },
        files: {
            'changed': []
        }
    }

    // Project configuration.
    grunt.initConfig({
        watch: {
            scripts: {
                files: [agility_config.options.src_dest + '**'],
                tasks: ['agility_push']
            },
            options: {
                spawn: false,
            }
        },
        jsbeautifier: {
            files: [agility_config.options.src_dest + '**/*.js', agility_config.options.src_dest + '**/*.json'],
            options: {}
        },
        clean: {
            folder: [agility_config.options.src_dest]
        },
        // Configuration to be run (and then tested).
        agility_push: {
            default_options: agility_config,
        },
        agility_pull: {
            default_options: agility_config,
        }
    });

    grunt.event.on('watch', function(action, filepath) {
        grunt.config(['agility_push', 'default_options', 'files', 'changed'], [filepath]);
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-agility-policy-pusher');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-jsbeautifier");

    // pull, removes policies and then downloads them from Agility
    grunt.registerTask('pull', ['clean', 'agility_pull']);

    // By default, clean policies, pull policies, beautify policies, watch, and push policies on change.
    grunt.registerTask('default', ['clean', 'agility_pull', 'jsbeautifier', 'watch']);

};