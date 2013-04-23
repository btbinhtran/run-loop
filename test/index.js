var loop = require('..')
  , assert = require('assert')

describe('run loop', function(){
  it('should run', function(done){
    loop.run(function(){
      done();
    });
  });
});