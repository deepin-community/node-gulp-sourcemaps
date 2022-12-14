'use strict';

var test = require('tape');
//BEGIN PRE-HOOK of debug
var yargs = require('yargs').argv;
var debug = require('debug-fabulous')();
var miss = require('mississippi');

var from = miss.from;
var pipe = miss.pipe;
var concat = miss.concat;

if (!yargs.ignoreLogTests){
  debug.save('gulp-sourcemaps:*');
  debug.enable(debug.load());
}
//END PRE-HOOK of debug (must be loaded before our main module (sourcemaps))
var sourcemaps = require('..');
var File = require('vinyl');
var hookStd = require('hook-std');
var helpers = require('./testHelpers');

test('init: should pass through when file is null', function(t) {
  // end inner conflict
  var file = new File();
  var pipeline = sourcemaps.init();
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.ok(!data.sourceMap, 'should not add a source map object');
    t.deepEqual(data, file, 'should not change file');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(file);
});

test('init: should emit an error if file content is a stream', function(t) {
  var pipeline = sourcemaps.init();
  pipeline.on('data', function() {
    t.fail('should emit an error');
    t.end();
  }).on('error', function() {
    t.ok('should emit an error');
    t.end();
  }).write(helpers.makeStreamFile());
});

test('init: should add an empty source map', function(t) {
  var pipeline = sourcemaps.init();
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.equal(data.sourceMap.sources[0], 'helloworld.js', 'should add file to sources');
    t.equal(data.sourceMap.sourcesContent[0], helpers.sourceContent, 'should add file content to sourcesContent');
    t.deepEqual(data.sourceMap.names, [], 'should add empty names');
    t.equal(data.sourceMap.mappings, '', 'should add empty mappings');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(helpers.makeFile());
});

test('init: should add a valid source map if wished', function(t) {
  var pipeline = sourcemaps.init({identityMap: true});
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.equal(data.sourceMap.sources[0], 'helloworld.js', 'should add file to sources');
    t.equal(data.sourceMap.sourcesContent[0], helpers.sourceContent, 'should add file content to sourcesContent');
    t.deepEqual(data.sourceMap.names, [
      'helloWorld', 'console', 'log'
    ], 'should add correct names');
    t.equal(data.sourceMap.mappings, 'AAAA,YAAY;;AAEZ,SAASA,UAAU,CAAC,EAAE;IAClBC,OAAO,CAACC,GAAG,CAAC,cAAc,CAAC;AAC/B', 'should add correct mappings');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(helpers.makeFile());
});

test('init: should add a valid source map for css if wished', function(t) {
  var pipeline = sourcemaps.init({identityMap: true});
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.equal(data.sourceMap.sources[0], 'test.css', 'should add file to sources');
    t.equal(data.sourceMap.sourcesContent[0], helpers.sourceContentCSS, 'should add file content to sourcesContent');
    t.deepEqual(data.sourceMap.names, [], 'should add correct names');
    t.equal(data.sourceMap.mappings, 'CAAC;GACE;GACA', 'should add correct mappings');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(helpers.makeFileCSS());
});

test('init: can replace `identityMap` option with sourcemap.identityMap stream (js file)', function(t) {
  var file = helpers.makeFile();

  function assert(files) {
    t.ok(files[0], 'should pass something through');
    t.ok(files[0] instanceof File, 'should pass a vinyl file through');
    t.ok(files[0].sourceMap, 'should add a source map object');
    t.equal(String(files[0].sourceMap.version), '3', 'should have version 3');
    t.equal(files[0].sourceMap.sources[0], 'helloworld.js', 'should add file to sources');
    t.equal(files[0].sourceMap.sourcesContent[0], helpers.sourceContent, 'should add file content to sourcesContent');
    t.deepEqual(files[0].sourceMap.names, [
      'helloWorld', 'console', 'log'
    ], 'should add correct names');
    t.equal(files[0].sourceMap.mappings, 'AAAA,YAAY;;AAEZ,SAASA,UAAU,CAAC,EAAE;IAClBC,OAAO,CAACC,GAAG,CAAC,cAAc,CAAC;AAC/B', 'should add correct mappings');
  }

  pipe([
    from.obj([file]),
    sourcemaps.init(),
    sourcemaps.identityMap(),
    sourcemaps.write(),
    concat(assert)
  ], function(err) {
    if (err) {
      t.fail('emitted error');
    }

    t.end();
  });
});

test('init: can replace `identityMap` option with sourcemap.identityMap stream (css file)', function(t) {
  var file = helpers.makeFileCSS();

  function assert(files) {
    t.ok(files[0], 'should pass something through');
    t.ok(files[0] instanceof File, 'should pass a vinyl file through');
    t.ok(files[0].sourceMap, 'should add a source map object');
    t.equal(String(files[0].sourceMap.version), '3', 'should have version 3');
    t.equal(files[0].sourceMap.sources[0], 'test.css', 'should add file to sources');
    t.equal(files[0].sourceMap.sourcesContent[0], helpers.sourceContentCSS, 'should add file content to sourcesContent');
    t.deepEqual(files[0].sourceMap.names, [], 'should add correct names');
    t.equal(files[0].sourceMap.mappings, 'CAAC;GACE;GACA', 'should add correct mappings');
  }

  pipe([
    from.obj([file]),
    sourcemaps.init(),
    sourcemaps.identityMap(),
    sourcemaps.write(),
    concat(assert)
  ], function(err) {
    if (err) {
      t.fail('emitted error');
    }

    t.end();
  });
});

test('init: should import an existing inline source map', function(t) {
  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.ok(data.sourceMap, 'should add a source map object');
    t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping in data.contents');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, [
      'test1.js', 'test2.js'
    ], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, [
      'console.log(\'line 1.1\');\nconsole.log(\'line 1.2\');\n', 'console.log(\'line 2.1\');\nconsole.log(\'line 2.2\');'
    ], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, 'AAAAA,QAAAC,IAAA,YACAD,QAAAC,IAAA,YCDAD,QAAAC,IAAA,YACAD,QAAAC,IAAA', 'should have right mappings');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(helpers.makeFileWithInlineSourceMap());
});

test('init: should load external source map file referenced in comment with the \/\/# syntax', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld2.js.map');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, ['helloworld2.js'], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, ['source content from source map'], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

test('init: css: should load external source map file referenced in comment with the \/\/*# syntax', function(t) {
  var file = helpers.makeFileCSS();
  file.contents = new Buffer(helpers.sourceContentCSS + '\n/*# sourceMappingURL=test.css.map */');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, ['../test.css'], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, ['body {\n  background: #eee;\n  color: #888;\n}\n\n'], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

test('init: should remove source map comment with the \/\/# syntax', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld2.js.map');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping');
    t.end();
  }).write(file);
});

test('init: css: should remove source map comment with the \/\/*# syntax', function(t) {
  var file = helpers.makeFileCSS();
  file.contents = new Buffer(helpers.sourceContentCSS + '\n/*# sourceMappingURL=test.css.map */');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    var actualContents = data.contents.toString();
    t.notOk(/sourceMappingURL/.test(actualContents), 'should not have sourcemapping');
    t.end();
  }).write(file);
});

test('init: should load external source map file referenced in comment with the \/*# *\/ syntax', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n/*# sourceMappingURL=helloworld2.js.map */');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, ['helloworld2.js'], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, ['source content from source map'], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

test('init: should remove source map comment with the \/\/# syntax', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n/*# sourceMappingURL=helloworld2.js.map */');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping');
    t.end();
  }).write(file);
});

test('init: should load external source map if no source mapping comment', function(t) {
  var file = helpers.makeFile();
  file.path = file.path.replace('helloworld.js', 'helloworld2.js');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, ['helloworld2.js'], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, ['source content from source map'], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

test('init: should load external source map and add sourceContent if missing', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld3.js.map');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, [
      'helloworld.js', 'test1.js'
    ], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, [
      file.contents.toString(), 'test1\n'
    ], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

test('init: should not throw when source file for sourceContent not found', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld4.js.map');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, [
      'helloworld.js', 'missingfile'
    ], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, [
      file.contents.toString(), null
    ], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

// vinyl 2.X breaks this spec, not exactly sure why but it is due to the following commit
// https://github.com/gulpjs/vinyl/commit/ece4abf212c83aa3e2613c57a4a0fe96171d5755
test('init: should use unix style paths in sourcemap', function(t) {
  var file = helpers.makeFile();
  file.base = file.cwd;

  var pipeline = sourcemaps.init();
  pipeline.on('data', function(data) {
    t.equal(data.sourceMap.file, 'assets/helloworld.js', 'should have right file');
    t.deepEqual(data.sourceMap.sources, ['assets/helloworld.js'], 'should have right sources');
    t.end();
  }).write(file);
});

test('init: should use sourceRoot when resolving path to sources', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld5.js.map');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, [
      '../helloworld.js', '../test1.js'
    ], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, [
      file.contents.toString(), 'test1\n'
    ], 'should have right sourcesContent');
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.equal(data.sourceMap.sourceRoot, 'test', 'should have right sourceRoot');
    t.end();
  }).write(file);
});

test('init: should not load source content if the path is a url', function(t) {
  var file = helpers.makeFile();
  file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld6.js.map');

  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.deepEqual(data.sourceMap.sources, [
      'helloworld.js', 'http://example2.com/test1.js'
    ], 'should have right sources');
    t.deepEqual(data.sourceMap.sourcesContent, [null, null]);
    t.equal(data.sourceMap.mappings, '', 'should have right mappings');
    t.end();
  }).write(file);
});

test('init: should pass through when file already has a source map', function(t) {
  var sourceMap = {
    version: 3,
    names: [],
    mappings: '',
    sources: ['test.js'],
    sourcesContent: ['testContent']
  };

  var file = helpers.makeFile();
  file.sourceMap = sourceMap;
  var pipeline = sourcemaps.init({loadMaps: true});
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.equal(data.sourceMap, sourceMap, 'should not change the source map');
    t.deepEqual(data, file, 'should not change file');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(file);
});

test('init: handle null contents', function(t) {
  var pipeline = sourcemaps.init({addComment: true});
  pipeline.on('data', function(data) {
    t.ok(data, 'should pass something through');
    t.ok(data instanceof File, 'should pass a vinyl file through');
    t.ok(data.sourceMap, 'should add a source map object');
    t.equal(String(data.sourceMap.version), '3', 'should have version 3');
    t.equal(data.sourceMap.sources[0], 'helloworld.js', 'should add file to sources');
    t.equal(data.sourceMap.sourcesContent[0], null, 'should add file content to sourcesContent');
    t.deepEqual(data.sourceMap.names, [], 'should add empty names');
    t.equal(data.sourceMap.mappings, '', 'should add empty mappings');
    t.end();
  }).on('error', function() {
    t.fail('emitted error');
    t.end();
  }).write(helpers.makeNullFile());
});

if (!yargs.ignoreLogTests){
  //should always be last as disabling a debug namespace does not work
  test('init: should output an error message if debug option is set and sourceContent is missing', function(t) {

    var file = helpers.makeFile();
    file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=helloworld4.js.map');

    var history = [];
    console.log('HOOKING');
    var unhook = hookStd.stderr(function(s) {
      history.push(s);
    });
    var pipeline = sourcemaps.init({loadMaps: true});

    pipeline.on('data', function() {
      unhook();
      var hasRegex =  function(regex){
        return function(s){
          return regex.test(s);
        };
      };
      console.log(history);
      t.ok(
        history.some(
          hasRegex(/No source content for "missingfile". Loading from file./g)), 'should log missing source content');
      t.ok(history.some(hasRegex(/source file not found: /g)), 'should warn about missing file');
      t.end();
    }).write(file);

  });

  test('init: should output an error message if debug option is set, loadMaps: true, and source map file not found', function(t) {
    var file = helpers.makeFile();
    file.contents = new Buffer(helpers.sourceContent + '\n//# sourceMappingURL=not-existent.js.map');

    var history = [];
    console.log('HOOKING');
    var unhook = hookStd.stderr(function(s) {
      history.push(s);
    });
    var pipeline = sourcemaps.init({loadMaps: true});

    pipeline.on('data', function() {
      unhook();
      var hasRegex =  function(regex){
        return function(s){
          return regex.test(s);
        };
      };
      console.log(history);
      t.ok(history.some(hasRegex(/warn: external source map not found or invalid: /g)), 'should warn about missing source map file');
      t.end();
    }).write(file);
  });
}
