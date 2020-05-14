var assert = require('assert')
import { bin } from '../../src/utils'
import { IndyDCPClient } from '../../src/dcp-client'

describe('IndyDCPClient', function () {
  describe('#handle_command()', function () {
    it('should return binary string', function () {
      var client = new IndyDCPClient()
      client.handle_command()
    })
  })
})
