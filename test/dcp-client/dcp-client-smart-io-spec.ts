import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#get_smart_dis()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()

      var dis = await client.get_smart_dis()
      console.log('Digital Inputs: ', dis)

      client.disconnect()
    })
  })
})
