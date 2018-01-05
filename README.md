# ember-cli-deploy-zipalign

[![Build Status](https://travis-ci.org/jelhan/ember-cli-deploy-zipalign.svg?branch=master)](https://travis-ci.org/jelhan/ember-cli-deploy-zipalign)

Plugin for ember-cli-deploy to [zipalign](https://developer.android.com/studio/command-line/zipalign.html)
an android build artifact.

## Installation

* `ember install ember-cli-deploy-zipalign`

## Usage

This plugin is designed to work together with [ember-cli-deploy-corber](https://github.com/jelhan/ember-cli-deploy-corber).
If you don't use that one, you have to make sure that a `corber.android` key exists on `context`, which contains an array
of paths to `.apk` files which should be zipaligned.

You could disable `zipalign` for a specific deployment target by setting `enabled` config to `false`.

Zipalign android debug builds may fail. Therefore it's highly recommended to disable this plugin if `corber.release` config is not `true`.
