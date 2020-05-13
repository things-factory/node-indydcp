var assert = require('assert')
import { bin } from '../../src/utils'

describe('Utils', function () {
  describe('bin', function () {
    it('should return binary string', function () {
      assert.equal(bin(4), '100')
      assert.equal(bin(5), '101')
      assert.equal(bin(10), '1010')
    })
  })
})
