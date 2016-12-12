# CSC Agility Platform Policy Pusher – for Grunt

> Downloadable open-source software for developing cloud governance policies used with cloud management software platforms

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install csc-agility-grunt-policy-pusher --save-dev
```

```shell
NOTE: This has not yet been published to npm. You must manually install by:

Install Nodejs.
Install Grunt globally: 'npm install -g grunt-cli'
Create a new local grunt project folder.
In the new folder install grunt locally: 'npm install grunt'
Copy all contents to node_modules\csc-agility-grunt-policy-pusher in the local grunt project folder.
Copy Gruntfile.js and package.json to the local grunt project folder.
Install dependencies based on the project folder: 'npm install'.
Edit the agility_config in Gruntfile.js. See below for more config information.
Run Grunt.
```

## The "agility_push" and "agility_pull" tasks

### Overview
In your project's Gruntfile, add a section named `agility_push` to the data object passed into `grunt.initConfig()`.

```js
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
grunt.initConfig({
    agility_push: {
        default_options: agility_config,
    },
    agility_pull: {
        default_options: agility_config,
    }
});
```

### Options

#### options.agility_ip
Type: `String`
Default value: `'localhost'`

The hostname of the Agility Platform you are developing against.

#### options.port
Type: `int`
Default value: `8443`

The port of the Agility Platform you are developing against.

#### options.username
Type: `String`
Default value: `'admin'`

The username you use to login to the Agility Platform.

#### options.password
Type: `String`
Default value: `'password'`

The password you use to login to the Agility Platform.

#### options.src_dest
Type: `String`
Default value: `'src/'`

The folder policy files will be placed in and the folder that will be watched for changes.

#### options.delimiter
Type: `String`
Default value: `'___'`

When creating local files for Event Policies, the delimiter will seperate the event policy name and the script name for the js script file name. If `'___'` occurs in policy names, change this value.

#### options.tree_folders
Type: `Boolean`
Default value: `true`

True: Seperates policies into a folder structure mimicing the container/project/environment structure of the Agility Platform

#### options.type_folders
Type: `Boolean`
Default value: `false`

True: Seperates policies into folders named based on the type of policy. IE: Event, Lifecycle-Validation, etc.

#### files.changed
Type: `String[]`
Default value: `[]`

DO NOT CHANGE. This is used to pass the changed files to grunt-contrib-watch.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
