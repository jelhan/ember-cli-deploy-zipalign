/* eslint-env node */
'use strict';

const BasePlugin = require('ember-cli-deploy-plugin');
const { Promise } = require('rsvp');
const { exec } = require('child_process');
const { rename, unlink } = require('fs');

module.exports = {
  name: 'ember-cli-deploy-zipalign',

  createDeployPlugin: function(options) {
    let DeployPlugin = BasePlugin.extend({
      name: options.name,

      defaultConfig: {
        enabled: true
      },

      prepare: function(context) {
        return new Promise((resolve, reject) => {
          if (!this.readConfig('enabled')) {
            return resolve();
          }

          // verify context
          if (!context.corber) {
            this.log(
              'Key corber does not exist on context. You might want to use ember-cli-deploy-corber.',
              { color: 'red' }
            );
            return reject();
          }
          if (!Array.isArray(context.corber.android) || context.corber.android.length === 0) {
            this.log(
              'Key corber.android does not exist on context or is empty. A corber build for android platform must be ' +
              'it\'s build artifacts must be added to corber.android key on context.',
              { color: 'red' }
            );
            return reject();
          }

          // zipalign all apks
          let promises = context.corber.android.map((apk) => this.zipalignApk(apk) );

          Promise.all(promises).then(() => {
            this.log('Zipalign ok', { verbose: true });
            return resolve();
          }).catch((err) => {
            return reject(err);
          });
        });
      },

      zipalignApk: function(apk) {
        return new Promise((resolve, reject) => {
          if (apk.includes('-debug.apk')) {
            this.log('Apk seems to be a debug build. Zipalign debug builds may fail.', { color: 'yellow' });
          }

          // zipalign requires input and output to be different files, therefore moving existing one to tmp location before
          let tmp = apk.concat('-tmp');
          rename(apk, tmp, (err) => {
            if (err) {
              this.log('Moving existing apk to tmp file failed.', { color: 'red' });
              return reject(err);
            }

            let cmd = `zipalign -f 4 ${tmp} ${apk}`;
            exec(cmd, (err, stdout, stderr) => {
              if (err) {
                this.log(`Executing zipalign fails. Command run: ${cmd}.`, { color: 'red' });
                this.log(stderr, { color: 'red' });
                return reject(err);
              }

              // delete tmp file
              unlink(tmp, (err) => {
                if (err) {
                  this.log(`Deleting tmp file ${tmp} failed`, { color: 'red' });
                  return reject(err);
                }

                this.log(`Zipalign ok for ${apk}`, { verbose: true });
                return resolve();
              });
            });
          });
        });
      }
    });

    return new DeployPlugin();
  }
}
