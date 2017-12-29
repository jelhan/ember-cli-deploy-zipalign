/*eslint-env node*/
'use strict';

const td = require('testdouble');
const { Promise } = require('rsvp');
const { assert } = require('chai');

describe('corber plugin', function() {
  let context;
  let subject;

  before(function() {
    subject = require('../index');
  });

  beforeEach(function() {
    context = {
      commandOptions: {
      },
      config: {
        zipalign: {
          enabled: true
        }
      },
      corber: {
        android: [
          '/path/to/foo.apk'
        ]
      },
      ui: {
      }
    };
  });

  it('has a name', function() {
    let plugin = subject.createDeployPlugin({
      name: 'zipalign'
    });

    assert.equal(plugin.name, 'zipalign');
  });

  it('implements prepare hook', function() {
    let plugin = subject.createDeployPlugin({
      name: 'zipalign'
    });

    assert.typeOf(plugin.prepare, 'function');
  });

  describe('configuration', function() {
    it('does not require any configuration', function() {
      let plugin = subject.createDeployPlugin({
        name: 'zipalign'
      });
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true);
    });
  });

  describe('prepare hook', function() {
    let childProcessMock;
    let fsMock;

    beforeEach(function() {
      childProcessMock = td.replace('child_process');
      td.when(childProcessMock.exec(td.matchers.anything())).thenCallback();

      fsMock = td.replace('fs');
      td.when(fsMock.rename(td.matchers.anything(), td.matchers.anything())).thenCallback();
      td.when(fsMock.unlink(td.matchers.anything())).thenCallback();

      subject = require('../index');
    });

    it('returns a promise', function() {
      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      assert.ok(plugin.prepare() instanceof Promise);
    });

    it('executes zipalign for all apks in context corber.android key', function() {
      context.corber.android = [
        '/path/to/foo.apk',
        '/path/to/bar.apk'
      ];
      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      return plugin.prepare(context).then(() => {
        td.verify(
          childProcessMock.exec(td.matchers.contains(/zipalign .* \/path\/to\/foo\.apk/), td.matchers.anything())
        );
        td.verify(
          childProcessMock.exec(td.matchers.contains(/zipalign .* \/path\/to\/bar\.apk/), td.matchers.anything())
        );
        assert.ok(true);
      });
    });

    it('cleans up temporary file', function() {
      context.corber.android = [
        '/path/to/foo.apk'
      ];

      // capture tmp file name
      let tmpFile;
      td.when(
          fsMock.rename(td.matchers.anything(), td.matchers.anything(), td.matchers.anything())
        )
        .thenDo((oldLocation, newLocation, callback) => {
          tmpFile = newLocation;
          callback();
        });

      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      return plugin.prepare(context)
        .then(() => {
          td.verify(
            fsMock.unlink(tmpFile, td.matchers.anything())
          );
        });
    });

    it('fails if corber key does not exist of context', function(done) {
      delete context.corber;

      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      plugin.prepare(context).then(
        () => {
          done(
            new Error('Promise should reject')
          );
        },
        () => {
          done();
        }
      );
    });

    it('fails if corber.android key does not exist of context', function(done) {
      delete context.corber.android;

      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      plugin.prepare(context).then(
        () => {
          done(
            new Error('Promise should reject')
          );
        },
        () => {
          done();
        }
      );
    });

    it('fails if corber.android key of context is not an array', function(done) {
      context.corber.android = {};

      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      plugin.prepare(context).then(
        () => {
          done(
            new Error('Promise should reject')
          );
        },
        () => {
          done();
        }
      );
    });

    it('fails if corber.android key of context is an empty array', function(done) {
      context.corber.android = [];

      let plugin = subject.createDeployPlugin({
        name: 'zipalign',
      });
      plugin.beforeHook(context);
      plugin.prepare(context).then(
        () => {
          done(
            new Error('Promise should reject')
          );
        },
        () => {
          done();
        }
      );
    });
  });
});
