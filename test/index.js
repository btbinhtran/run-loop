var loop = 'undefined' == typeof window ? require('..') : require('tower-run-loop')
  , assert = require('component-assert')

describe('run loop', function(){

  it('should run', function(done){
    loop(function(){
      done();
    });
  });

});